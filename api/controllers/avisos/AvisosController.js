const moment = require('moment');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
//const moment = require('moment-timezone');
const duracionAMinutos = (str) => {
    const [h, m] = str.split(':').map(Number);
    return (h * 60) + m;
};

async function calcularAgendaSecuencial(ingenieroId, oficinaId, equipos) {
    const oficina = await Oficinas.findOne({ id: oficinaId });
    
    // Convertir duracion "01:30" a minutos
    //const [hrs, mins] = problema.duracion.split(':').map(Number);
    let duracionMinutos = 0;
    for (let eq of equipos) {
        // Buscamos el tipo de problema para obtener su duración
        const problema = await TipoProblemas.findOne({ id: eq.tipoProblema });
        if (problema && problema.duracion) {
            const [hrs, mins] = problema.duracion.split(':').map(Number);
            duracionMinutos += (hrs * 60) + mins;
        }
    }

    let encontrado = false;
    let fechaEvaluar = new Date(); // Empezamos a revisar desde "ahora"
    let fechaInicio, fechaFin;

    while (!encontrado) {
        let diaSemana = fechaEvaluar.getDay();

        // 1. Saltar Domingos automáticamente
        if (diaSemana === 0) {
            fechaEvaluar.setDate(fechaEvaluar.getDate() + 1);
            fechaEvaluar.setHours(0, 0, 0, 0);
            continue;
        }

        // 2. Definir límites laborales de este día evaluado
        const esSabado = (diaSemana === 6);
        const [hEntrada, mEntrada] = (esSabado ? oficina.horariosabadoentrada : oficina.horariolventrada).split(':').map(Number);
        const [hSalida, mSalida] = (esSabado ? oficina.horariosabadosalida : oficina.horariolvsalida).split(':').map(Number);

        let limiteEntrada = new Date(fechaEvaluar); limiteEntrada.setHours(hEntrada, mEntrada, 0, 0);
        let limiteSalida = new Date(fechaEvaluar); limiteSalida.setHours(hSalida, mSalida, 0, 0);

        // 3. Buscar el aviso que termina MÁS TARDE en este día específico
        let inicioDia = new Date(fechaEvaluar); inicioDia.setHours(0, 0, 0, 0);
        let finDia = new Date(fechaEvaluar); finDia.setHours(23, 59, 59, 999);

        const ultimoAvisoDelDia = await Avisos.find({
            atendidoPor: ingenieroId,
            fechaAtencion: { '>=': inicioDia, '<=': finDia }
        }).sort('fechaFin DESC').limit(1);

        // 4. Determinar punto de partida para este día
        let puntoInicio;
        if (ultimoAvisoDelDia.length > 0) {
            puntoInicio = new Date(ultimoAvisoDelDia[0].fechaFin);
        } else {
            // Si no hay avisos, comparamos la hora de entrada vs la hora actual
            // (Solo aplica si estamos evaluando "hoy", para días futuros manda la hora de entrada)
            let ahora = new Date();
            puntoInicio = (fechaEvaluar.toDateString() === ahora.toDateString()) 
                          ? (ahora > limiteEntrada ? ahora : limiteEntrada)
                          : limiteEntrada;
        }

        // 5. Validar si el punto de inicio cabe en el horario laboral de hoy
        if (puntoInicio < limiteSalida) {
            // ¡Hay espacio!
            fechaInicio = new Date(puntoInicio);
            fechaFin = moment(fechaInicio).add(duracionMinutos, 'minutes').toDate();
            encontrado = true;
        } else {
            // No hay espacio hoy, saltamos al día siguiente a las 00:00 para re-evaluar
            fechaEvaluar.setDate(fechaEvaluar.getDate() + 1);
            fechaEvaluar.setHours(0, 0, 0, 0);
        }
    }

    return { fechaInicio, fechaFin };
}
async function calcularMinutos(fechaInicio,fechaCierre,oficina){
    let minutosTotales=0;
    let current = moment(fechaInicio);
            while (current.isBefore(fechaCierre)) {
                let diaSemana = current.day(); // 0=Dom, 6=Sab
                if (diaSemana !== 0) { 
                    let entrada, salida;

                    if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
                        entrada = oficina.horariolventrada;
                        salida = oficina.horariolvsalida;
                    } else if (diaSemana === 6) { // Sábado
                        entrada = oficina.horariosabadoentrada;
                        salida = oficina.horariosabadosalida;
                    }

                    if (entrada && salida) {
                        let inicioLaboral = moment(current.format('YYYY-MM-DD') + ' ' + entrada);
                        let finLaboral = moment(current.format('YYYY-MM-DD') + ' ' + salida);
                        
                        // Determinar el bloque de tiempo trabajado hoy
                        let inicioDeHoy = moment.max(current, inicioLaboral);
                        let finDeHoy = moment.min(fechaCierre, finLaboral);

                        if (inicioDeHoy.isBefore(finDeHoy)) {
                            minutosTotales += finDeHoy.diff(inicioDeHoy, 'minutes');
                        }
                    }
                }
                // Avanzar al día siguiente a las 00:00 para seguir el ciclo
                current.add(1, 'day').startOf('day');
            }
    return minutosTotales;
}
async function calcularMinutosSincomida(fechaInicio, fechaCierre, oficina, horaComida) {
    /*console.log("fechaInicio: ",fechaInicio)
    console.log("fechaCierre: ",fechaCierre)
    console.log("oficina: ",oficina)
    console.log("horaComida: ",horaComida)
*/
    let minutosTotales = 0;
    let current = moment(fechaInicio);
    const DURACION_COMIDA = 60; // minutos

    while (current.isBefore(fechaCierre)) {
        let diaSemana = current.day(); 
        
        if (diaSemana !== 0) { // No contar domingos
            let entrada, salida;

            if (diaSemana >= 1 && diaSemana <= 5) {
                entrada = oficina.horariolventrada;
                salida = oficina.horariolvsalida;
            } else if (diaSemana === 6) {
                entrada = oficina.horariosabadoentrada;
                salida = oficina.horariosabadosalida;
            }

            if (entrada && salida) {
                let inicioLaboral = moment(current.format('YYYY-MM-DD') + ' ' + entrada);
                let finLaboral = moment(current.format('YYYY-MM-DD') + ' ' + salida);
                
                // Definir rango de comida para el día actual
                let inicioComida = moment(current.format('YYYY-MM-DD') + ' ' + horaComida);
                let finComida = moment(inicioComida).add(DURACION_COMIDA, 'minutes');

                // 1. Calcular el bloque de tiempo laborable del día (sin descontar comida aún)
                let inicioEfectivo = moment.max(current, inicioLaboral);
                let finEfectivo = moment.min(fechaCierre, finLaboral);

                if (inicioEfectivo.isBefore(finEfectivo)) {
                    // Minutos brutos trabajados en el rango laboral
                    let minutosDia = finEfectivo.diff(inicioEfectivo, 'minutes');

                    // 2. Calcular traslape con la hora de comida
                    // El traslape es el tiempo que coincide entre [inicioEfectivo, finEfectivo] y [inicioComida, finComida]
                    let inicioTraslapeComida = moment.max(inicioEfectivo, inicioComida);
                    let finTraslapeComida = moment.min(finEfectivo, finComida);

                    if (inicioTraslapeComida.isBefore(finTraslapeComida)) {
                        let minutosADescontar = finTraslapeComida.diff(inicioTraslapeComida, 'minutes');
                        minutosDia -= minutosADescontar;
                    }
                    //console.log("minutos día: ",minutosDia)
                    minutosTotales += minutosDia;
                }
            }
        }
        current.add(1, 'day').startOf('day');
    }
    return minutosTotales;
}

    async function enviarReportePDF(id) {
        const data = await obtenerDatosCompletosIntervencion(id);
        console.log(data)
        let subtotalGeneral = 0;

        data.equipos.forEach(eq => {
            eq.articulos.forEach(art => {
                // Cálculo de subtotal por línea
                art.subtotalLinea = Number(art.cantidad) * Number(art.costopublico);
                subtotalGeneral += art.subtotalLinea;
            });
        });
        const iva = subtotalGeneral * 0.16;
        const totalFinal = subtotalGeneral + iva;
        const formatter = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        });
        //const money = (valor) => formatter.format(valor || 0);
        const money = (valor) => {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2
            }).format(Number(valor || 0).toFixed(2)); // Redondeo a 2 decimales
        };

        // Función auxiliar para convertir minutos a HH:mm
        const formatTime = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        let firmaBase64 = null;

        if (data.firma) {
            const rutaFirma = path.resolve(sails.config.appPath, 'assets', data.firma.replace(/^\//, ''));
            if (fs.existsSync(rutaFirma)) {
                const imagen = fs.readFileSync(rutaFirma);
                firmaBase64 = `data:image/jpeg;base64,${imagen.toString('base64')}`;
            }
        }

        // 1. Encontrar al coordinador de la oficina
        // Buscamos un usuario que pertenezca a la oficina y tenga la bandera coordinador: true
        let idsOficinas = [data.oficina.id];
        if (data.ubicacion && data.ubicacion.oficinaAsignada) {
            idsOficinas.push(data.ubicacion.oficinaAsignada);
        }
        const coordinadores = await User.find({
            oficinas: idsOficinas,
            coordinador: true
        });


        // 2. Generar el PDF
        const html = await sails.renderView('templates/pdf-reporte', { 
            intervencion: data, 
            layout: false, 
            moment: moment,
            tRespuesta:formatTime(data.tiemporespuesta),
            tSolucion:formatTime(data.tiemposolucion),
            firma:firmaBase64,
            iva:iva,
            totalFinal:totalFinal,
            subtotalGeneral:subtotalGeneral,
            money:money,

        });
        const pdfBuffer = await sails.helpers.generarPdf(html);

        // 3. Definir destinatarios y sus roles para personalización
        const destinatarios = [];

        // Cliente: Prioridad al contacto, si no, al correo del modelo Cliente
        const emailCliente = (data.contacto && data.contacto.email) ? data.contacto.email : data.cliente.email;
        const nombreCliente = (data.contacto && data.contacto.nombre) ? data.contacto.nombre : data.cliente.razonsocial;

        if (emailCliente) {
            destinatarios.push({ email: emailCliente, nombre: nombreCliente, rol: 'cliente' });
        }

        // Ingeniero (Atendido por)
        if (data.atendidoPor && data.atendidoPor.email) {
            destinatarios.push({ email: data.atendidoPor.email, nombre: data.atendidoPor.nombre, rol: 'ingeniero' });
        }

        // Coordinador
        
        if (coordinadores.length > 0) {
            coordinadores.forEach(coord => {
                destinatarios.push({ 
                    email: coord.email, 
                    nombre: coord.nombre, 
                    rol: 'coordinador' 
                });
            });
        }

        // 4. Enviar correos de forma individual para personalizar el saludo
        const commonData = {
            folio: data.aviso.folio,
            cliente: data.cliente.razonsocial,
            ubicacion: data.ubicacion.nombre,
            tecnico: data.atendidoPor.nombre,
            fechaCierre: moment(data.fechaCierre).format('DD/MM/YYYY HH:mm')
        };
        let seguimiento="Correos enviados: "
        const envios = destinatarios.map(dest => {
            seguimiento=seguimiento+` ${dest.email}`;
            return sails.helpers.enviarCorreoIntervencion.with({
                to: dest.email,
                subject: `Reporte de Servicio Técnico - Folio ${data.aviso.folio}`,
                template: 'templates/email-reporte',
                templateData: { 
                    ...commonData, 
                    rol: dest.rol, 
                    destinatario: dest.nombre 
                },
                attachments: [{
                    filename: `Reporte_${data.aviso.folio}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            });
        });

        await Promise.all(envios);
        await SeguimientoAviso.create({aviso:data.aviso.id,usuario:data.atendidoPor.id,descripcion:seguimiento})
    }
    async function obtenerDatosCompletosIntervencion(id) {
        const moment = require('moment');

        // 1. Buscamos la intervención base con sus relaciones principales
        let intervencion = await Intervenciones.findOne({ id }).populate('cliente').populate('ubicacion').populate('aviso').populate('atendidoPor').populate('oficina').populate('contacto');

        if (!intervencion) { return null; }

        // 2. Buscamos los equipos vinculados a esta intervención
        let equiposAtendidos = await IntervencionEquipo.find({ intervencion: id })
        .populate('equipo')      // Trae marca, modelo, serie
        .populate('contadores')  // Trae la colección de lecturas
        .populate('articulos');   // Trae la colección de materiales

        // 3. Deep Populate Manual con Promise.all (Súper eficiente)
        // Recorremos los equipos para traer los detalles de los hijos
        await Promise.all(equiposAtendidos.map(async (eq) => {
            // Poblamos los nombres de los Contadores
            const promesasContadores = eq.contadores.map(async (cont) => {
                const detalleTipo = await TipoContadores.findOne({ id: cont.tipoContador });
                cont.nombreContador = detalleTipo ? detalleTipo.nombre : 'Contador';
                cont.tipo = detalleTipo ? detalleTipo.tipocontador : '';
            });
            // Poblamos los detalles de los Artículos (Materiales)
            const promesasArticulos = eq.articulos.map(async (art) => {
                const detalleArt = await Articulos.findOne({ id: art.articulo });
                art.detalleArticulo = detalleArt || { nombre: 'N/A', codigo: 'S/C' };
            });
            eq.tipoAviso=await TipoAvisos.findOne({id:eq.tipoAviso});
            eq.tipoProblema=await TipoProblemas.findOne({id:eq.tipoProblema});
            // Esperamos a que todas las consultas de este equipo terminen
            return Promise.all([...promesasContadores, ...promesasArticulos]);
        }));
        intervencion.aviso.tipoAviso=await TipoAvisos.findOne({id:intervencion.aviso.tipoAviso})
        if(intervencion.contacto){
            intervencion.contacto.tipocontacto=await TipoContacto.findOne({id:intervencion.contacto.tipocontacto})
        }
        
        // 4. Inyectamos los equipos ya procesados dentro del objeto intervención
        intervencion.equipos = equiposAtendidos;
        console.log(intervencion.contacto)
        // 5. Devolvemos el objeto "gordo" listo para el PDF o la Vista
        return intervencion;
    }

module.exports={
    index:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ahora = new Date().getTime(); // Timestamp actual
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        const avisos = await Avisos.find({ where: {activo:1,estado:'pendiente',or: [{ oficina: oficinaId },{ ubicacion: idsUbicacionesForaneas } ]}}).populate('cliente').populate('ubicacion').populate('oficina').populate('atendidoPor').populate('tipoAviso').populate('prioridad').populate('equiposInvolucrados')
        await Promise.all(
            avisos.map(async (aviso)=>{
                // LLAMADA A TU FUNCIÓN DE HORARIOS
                // Pasamos fecha inicio, fecha fin (ahora) y la oficina para los horarios
                let fechaInicio=moment(aviso.createdAt).tz("America/Mexico_City");
                let fechaCierre=moment(ahora).tz("America/Mexico_City")
                console.log("Fecha cierre aviso: ",aviso.fechaCierre)
                if(aviso.fechaCierre){
                    console.log("Entra a aviso fecha cierre")
                    fechaCierre=moment(aviso.fechaCierre).tz("America/Mexico_City")
                }
                
                const tecnico = await User.findOne({id: aviso.atendidoPor.id});
                const minutosHabiles = await calcularMinutosSincomida(
                    fechaInicio, 
                    fechaCierre, 
                    aviso.oficina,
                    tecnico.horacomida
                );

                // Determinamos el TR objetivo (Poliza o Estimado)
                let trObjetivo=0;
                if(aviso.oficina.id===oficinaId){
                    trObjetivo=aviso.trEstimado
                }else{
                    if(aviso.ubicacion.oficinaAtencion==oficinaId){
                        trObjetivo=aviso.trPoliza
                    }
                }
                //const trObjetivo = (aviso.trPoliza && aviso.trPoliza > 0) ? aviso.trPoliza : aviso.trEstimado;

                // Guardamos los cálculos en el objeto aviso
                aviso.minutosTranscurridos = minutosHabiles;
                aviso.trObjetivo = trObjetivo;
                aviso.fueraDeTiempo = minutosHabiles > trObjetivo;
                aviso.equiposInvolucrados=await Promise.all(
                    aviso.equiposInvolucrados.map(async (eo) => {
                        let equipos=await AvisoEquipo.findOne({id:eo.id}).populate('tipoProblema').populate('equipo')
                        
                        let datos={
                            tipoProblema:equipos.tipoProblema.nombre,
                            serie:equipos.equipo.numeroserie,
                            marca:equipos.equipo.marca,
                            modelo:equipos.equipo.modelo,
                            descripcion:equipos.equipo.descripcion
                        }
                        eo.equipo = datos;
                        return eo;
                    })
                )
            })
        );
        return res.view("pages/avisos/pendientes",{avisos});
    },
    ficha:async function(req,res){
        let id=req.params.id
        let aviso=await Avisos.findOne({id:id}).populate('cliente').populate('cliente').populate('ubicacion').populate('creadoPor').populate('atendidoPor').populate('tipoAviso').populate('prioridad').populate('oficina').populate('contacto')

        let equipos=await AvisoEquipo.find({aviso:aviso.id}).populate('equipo').populate('tipoProblema').populate('prioridad')
        let seguimiento=await SeguimientoAviso.find({aviso:aviso.id}).populate('usuario');
        let intervenciones=await Intervenciones.find({aviso:aviso.id}).populate('atendidoPor').populate('contacto').populate('tipoAviso');
        if (aviso.oficina.id!=req.oficinaElegida.id && aviso.ubicacion.oficinaAtencion!=req.oficinaElegida.id) {
            return res.view("pages/avisos/ficha",{aviso,equipos,permiso:0,seguimiento,intervenciones});
        }
        //console.log("Equipos: ",equipos)
       // console.log("intervencion: ",intervenciones)
        return res.view("pages/avisos/ficha",{aviso,equipos,permiso:1,seguimiento,intervenciones});
    },
    formCrearAviso:async function(req,res){
        let prioridad=await Prioridad.find({activo:1})
        let tipoAvisos=await TipoAvisos.find({activo:1})
        return res.view("pages/avisos/crear",{prioridad,tipoAvisos});
    },
    formEditarAviso:async function(req,res){
        let prioridad=await Prioridad.find({activo:1})
        let tipoAvisos=await TipoAvisos.find({activo:1})
        let aviso=await Avisos.findOne({id:req.params.id}).populate('cliente').populate('contacto').populate('ubicacion').populate('equiposInvolucrados');
        const oficinaId = req.oficinaElegida.id;
        
        let ub=await ClienteUbicacion.find({cliente:aviso.cliente.id,activo:1});
        let ubicaciones
        if(aviso.cliente.oficina!=oficinaId){
            ubicaciones= ub.filter(item => item.oficinaAtencion === oficinaId);
        }else{
            ubicaciones=ub
        }
        let contactos=await ClienteContacto.find({cliente:aviso.cliente.id,activo:1})
        
        let equipos=await Equipos.find({cliente:aviso.cliente.id,ubicacion:aviso.ubicacion.id})
        let tipoProblemas=await TipoProblemas.find({tipoAvisos:aviso.tipoAviso,activo:1})
        aviso.equiposInvolucrados=await Promise.all(
            aviso.equiposInvolucrados.map(async (eo) => {
                let equipos=await AvisoEquipo.findOne({id:eo.id}).populate('tipoProblema').populate('equipo')
                let datos={
                    tipoProblema:equipos.tipoProblema.nombre,
                    serie:equipos.equipo.numeroserie,
                    marca:equipos.equipo.marca,
                    modelo:equipos.equipo.modelo,
                    descripcion:equipos.equipo.descripcion,
                    id:equipos.equipo.id
                }
                eo.equipo = datos;
                return eo;
            })
        )
        equipos=await Promise.all(
            equipos.map(async (eo) => {
                let eq=await AvisoEquipo.findOne({id:eo.id})
                if(eq){
                    eo.aviso=true
                }else{
                    eo.aviso=false
                }
                return eo;
            })
        )
        //const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        console.log("Aviso: ",aviso)
        console.log("Equipo: ",equipos)
        if (aviso.oficina!=req.oficinaElegida.id && aviso.ubicacion.oficinaAtencion!=req.oficinaElegida.id) {
            return res.view("pages/avisos/editar",{prioridad,tipoAvisos,aviso,ubicaciones,contactos,equipos,tipoProblemas,permiso:0});
        }
        return res.view("pages/avisos/editar",{prioridad,tipoAvisos,aviso,ubicaciones,contactos,equipos,tipoProblemas,permiso:1});
    },
    crear:async function(req,res){
        //console.log(req.body)
        let notificaciones=[];
        let avisosCreadosTotales=0;
        await sails.getDatastore().transaction(async (db) => {
            let cliente=await Clientes.findOne({id:req.body.cliente});
            let contacto=await ClienteContacto.findOne({id:req.body.contacto});
            let ub=await ClienteUbicacion.findOne({id:req.body.ubicacion}).populate('ruta');
            let tA=await TipoAvisos.findOne({id:req.body.tipoAviso});

            const ultimoAvisoOficina = await Avisos.find({ oficina: cliente.oficina }).sort('createdAt DESC').limit(1).usingConnection(db);
            console.log("lastAviso",ultimoAvisoOficina)
            let siguienteFolio = parseInt(ultimoAvisoOficina[0]?.folio || 0) + 1;
            console.log("folio",siguienteFolio)
            const crearAvisoConEquipos = async (listaDeEquipos) => {
                const coords = await User.find({
                    where:{
                        or: [
                            { oficinas: cliente.oficina, coordinador: true },
                            { oficinas: ub.oficinaAtencion ? ub.oficinaAtencion.id : null, coordinador: true }
                        ],
                        activo:1
                    }
                }).usingConnection(db);

                const tecnico = await User.findOne({id: ub.ruta.usuario}).usingConnection(db);
                const listaEmailsCoordinadores = coords.map(c => c.email).filter(email => email);
                const idsEquipos = listaDeEquipos.map(item => item.id);
                const equiposDetallados = await Equipos.find({ id: idsEquipos }).usingConnection(db);
                // 2. Llamamos a la lógica de agenda (la función anterior)
                const agenda = await calcularAgendaSecuencial(ub.ruta.usuario, req.oficinaElegida.id, listaDeEquipos);

                const nuevoAviso = await Avisos.create({
                    folio: siguienteFolio++,
                    tipoAviso: req.body.tipoAviso,
                    oficina: cliente.oficina,
                    cliente:cliente.id,
                    ubicacion:ub.id,
                    fechaAtencion:agenda.fechaInicio,
                    fechaFin:agenda.fechaFin,
                    creadoPor:req.session.usuario.id,
                    atendidoPor:ub.ruta.usuario,
                    prioridad:req.body.prioridad,
                    observaciones:req.body.observaciones,
                    contacto:contacto.id,
                    trEstimado:equiposDetallados[0].trEstimado,
                    trPoliza:equiposDetallados[0].trPoliza
                }).fetch().usingConnection(db);
                await SeguimientoAviso.create({aviso:nuevoAviso.id,usuario:req.session.usuario.id,descripcion:`Aviso creado, programado y asignado a ${tecnico.nombre}`})
                
                const tablaEquiposHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Serie</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Marca</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Modelo</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${equiposDetallados.map(e => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">${e.numeroserie || 'S/N'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${e.marca || 'N/A'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${e.modelo || 'N/A'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6; font-size: 11px; color: #666;">${e.descripcion || 'Sin descripción'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                const fechaFormateada = moment(agenda.fechaInicio).format('DD [de] MMMM [de] YYYY');
                const horaInicio = moment(agenda.fechaInicio).format('HH:mm');
                const horaFin = moment(agenda.fechaFin).format('HH:mm');

                    // Resultado para el correo:
                const textoEstetico = `${fechaFormateada} | ${horaInicio} - ${horaFin} hrs`;
                notificaciones.push({
                    folio: nuevoAviso.folio,
                    aviso:nuevoAviso.id,
                    usuario:nuevoAviso.creadoPor,
                    cliente: cliente.razonsocial,
                    ubicacionNombre: ub.nombre,
                    fechaAtencion:`${textoEstetico}`,
                    equiposHTML: tablaEquiposHTML,
                    emailCliente: contacto.email || null,
                    emailIngeniero: tecnico?.email || null,
                    nombreIngeniero: tecnico ? `${tecnico.nombre}` : 'No asignado',
                    emailsCoordinadores: listaEmailsCoordinadores,
                    tipoAviso:tA.nombre
                });
                for (const eq of listaDeEquipos) {
                    await AvisoEquipo.create({
                        aviso: nuevoAviso.id,
                        equipo: eq.id,
                        oficina: cliente.oficina,
                        tipoProblema: eq.tipoProblema,
                        observaciones:eq.descripcion,
                        estado:eq.estado,
                        prioridad:eq.prioridad,
                        cliente:cliente.id,
                        ubicacion:ub.id,
                        contacto:contacto.id,
                        trEstimado:equiposDetallados[0].trEstimado,
                        trPoliza:equiposDetallados[0].trPoliza
                    }).usingConnection(db);
                }
                avisosCreadosTotales++;
            };
            await crearAvisoConEquipos(req.body.datos);
        })
            setImmediate(async () => {
                //console.log("notificaciones: ",notificaciones)
                for (const nota of notificaciones) {
                   let avisoEmail='Email de aviso programado: ';

                    const detallesBase = {
                        folio: nota.folio,
                        cliente: nota.cliente,
                        ubicacion: nota.ubicacionNombre,
                        fecha: nota.fechaAtencion,
                        equiposHTML: nota.equiposHTML,
                        aviso:nota.aviso,
                        usuario:nota.usuario
                    };

                    try {
                        if (nota.emailCliente) {
                            let c=await sails.helpers.sendEmail.with({
                                to: nota.emailCliente,
                                subject: `Confirmación de Aviso - Folio ${nota.folio}`,
                                titulo: '!Aviso Programado!',
                                mensaje: `Hola ${nota.cliente}, se ha generado un aviso de ${nota.tipoAviso} para los siguientes equipos:`,
                                detalles: detallesBase,
                                color: '#28a745'
                            });
                            console.log("Cliente: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailCliente} `
                            }
                            console.log("Cliente: ",avisoEmail)
                        }
                        if (nota.emailIngeniero) {
                            let c= await sails.helpers.sendEmail.with({
                                to: nota.emailIngeniero,
                                subject: `Nuevo Aviso Asignado - Folio ${nota.folio}`,
                                titulo: 'Nuevo Aviso',
                                mensaje: `Se te ha asignado un aviso de ${nota.tipoAviso} para el cliente ${nota.cliente}.`,
                                detalles: detallesBase,
                                color: '#007bff'
                            });
                            console.log("Ingeniero: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailIngeniero} `
                            }
                            console.log("Ingeniero: ",avisoEmail)
                        }
                        if (nota.emailsCoordinadores.length > 0) {
                           let c= await sails.helpers.sendEmail.with({
                                to: nota.emailsCoordinadores.join(','),
                                subject: `Supervisión: Aviso Generado ${nota.folio}`,
                                titulo: 'Notificación Administrativa',
                                mensaje: `Se ha generado el aviso de ${nota.tipoAviso} folio ${nota.folio}. Ingeniero asignado: ${nota.nombreIngeniero}.`,
                                detalles: detallesBase,
                                color: '#343a40'
                            });
                            console.log("Coordinador: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailsCoordinadores.join(' ')} `
                            }
                            console.log("Coordinador: ",avisoEmail)
                        }
                        console.log("seguimiento: ")
                        await SeguimientoAviso.create({aviso:nota.aviso,usuario:nota.usuario,descripcion:avisoEmail})
                    } catch (e) { sails.log.error(e); }
                }
                
            });
            return res.status(200).send({ resp: 1, cantidad: avisosCreadosTotales});
    },
    editar:async function(req,res){
        //console.log(req.body)
        let notificaciones=[];
        let avisosCreadosTotales=0;
        let aviso=await Avisos.findOne({id:req.body.aviso}).populate('tipoAviso');
        let equiposAvisos=await AvisoEquipo.find({aviso:aviso.id});
        await AvisoEquipo.destroy({aviso:aviso.id})
        await sails.getDatastore().transaction(async (db) => {
            let cliente=await Clientes.findOne({id:req.body.cliente});
            let contacto=await ClienteContacto.findOne({id:req.body.contacto});
            let ub=await ClienteUbicacion.findOne({id:req.body.ubicacion}).populate('ruta');

            const crearAvisoConEquipos = async (listaDeEquipos) => {
                const coords = await User.find({
                    where:{
                        or: [
                            { oficinas: cliente.oficina, coordinador: true },
                            { oficinas: ub.oficinaAtencion ? ub.oficinaAtencion.id : null, coordinador: true }
                        ],
                        activo:1
                    }
                }).usingConnection(db);

                const tecnico = await User.findOne({id: ub.ruta.usuario}).usingConnection(db);
                const listaEmailsCoordinadores = coords.map(c => c.email).filter(email => email);
                const idsEquipos = listaDeEquipos.map(item => item.id);
                const equiposDetallados = await Equipos.find({ id: idsEquipos }).usingConnection(db);
                // 2. Llamamos a la lógica de agenda (la función anterior)

                await Avisos.updateOne({id:aviso.id}).set({
                    tipoAviso: req.body.tipoAviso,
                    ubicacion:ub.id,
                    creadoPor:req.session.usuario.id,
                    atendidoPor:ub.ruta.usuario,
                    prioridad:req.body.prioridad,
                    observaciones:req.body.observaciones,
                    contacto:contacto.id
                });
                await SeguimientoAviso.create({aviso:aviso.id,usuario:req.session.usuario.id,descripcion:`Aviso modificado, programado y asignado a ${tecnico.nombre}`})
                
                const tablaEquiposHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Serie</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Marca</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Modelo</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${equiposDetallados.map(e => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">${e.numeroserie || 'S/N'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${e.marca || 'N/A'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${e.modelo || 'N/A'}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6; font-size: 11px; color: #666;">${e.descripcion || 'Sin descripción'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                const fechaFormateada = moment(aviso.fechaAtencion).format('DD [de] MMMM [de] YYYY');
                const horaInicio = moment(aviso.fechaAtencion).format('HH:mm');
                const horaFin = moment(aviso.fechaFin).format('HH:mm');

                    // Resultado para el correo:
                const textoEstetico = `${fechaFormateada} | ${horaInicio} - ${horaFin} hrs`;
                notificaciones.push({
                    folio: aviso.folio,
                    aviso:aviso.id,
                    usuario:req.session.usuario.id,
                    cliente: cliente.razonsocial,
                    ubicacionNombre: ub.nombre,
                    fechaAtencion:`${textoEstetico}`,
                    equiposHTML: tablaEquiposHTML,
                    emailCliente: contacto.email || null,
                    emailIngeniero: tecnico?.email || null,
                    nombreIngeniero: tecnico ? `${tecnico.nombre}` : 'No asignado',
                    emailsCoordinadores: listaEmailsCoordinadores,
                    tipoAviso:aviso.tipoAviso.nombre
                });
                for (const eq of listaDeEquipos) {
                    await AvisoEquipo.create({
                        aviso: aviso.id,
                        equipo: eq.id,
                        oficina: cliente.oficina,
                        tipoProblema: eq.tipoProblema,
                        observaciones:eq.descripcion,
                        estado:eq.estado,
                        prioridad:eq.prioridad,
                        cliente:cliente.id,
                        ubicacion:ub.id,
                        contacto:contacto.id
                    }).usingConnection(db);
                }
                avisosCreadosTotales++;
            };
            await crearAvisoConEquipos(req.body.datos);
        })
            setImmediate(async () => {
                //console.log("notificaciones: ",notificaciones)
                for (const nota of notificaciones) {
                   let avisoEmail='Email de aviso modificado: ';

                    const detallesBase = {
                        folio: nota.folio,
                        cliente: nota.cliente,
                        ubicacion: nota.ubicacionNombre,
                        fecha: nota.fechaAtencion,
                        equiposHTML: nota.equiposHTML,
                        aviso:nota.aviso,
                        usuario:nota.usuario
                    };

                    try {
                        if (nota.emailCliente) {
                            let c=await sails.helpers.sendEmail.with({
                                to: nota.emailCliente,
                                subject: `Modificación de Aviso - Folio ${nota.folio}`,
                                titulo: 'Aviso Modificado!',
                                mensaje: `Hola ${nota.cliente}, se ha modificado un aviso de ${nota.tipoAviso} para los siguientes equipos:`,
                                detalles: detallesBase,
                                color: '#28a745'
                            });
                            console.log("Cliente: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailCliente} `
                            }
                            console.log("Cliente: ",avisoEmail)
                        }
                        if (nota.emailIngeniero) {
                            let c= await sails.helpers.sendEmail.with({
                                to: nota.emailIngeniero,
                                subject: `Aviso Modificado - Folio ${nota.folio}`,
                                titulo: 'Aviso Modificado',
                                mensaje: `Se ha modificado un aviso de ${nota.tipoAviso} para el cliente ${nota.cliente}.`,
                                detalles: detallesBase,
                                color: '#007bff'
                            });
                            console.log("Ingeniero: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailIngeniero} `
                            }
                            console.log("Ingeniero: ",avisoEmail)
                        }
                        if (nota.emailsCoordinadores.length > 0) {
                           let c= await sails.helpers.sendEmail.with({
                                to: nota.emailsCoordinadores.join(','),
                                subject: `Supervisión: Aviso Generado ${nota.folio}`,
                                titulo: 'Notificación Administrativa',
                                mensaje: `Se ha modificado el aviso de ${nota.tipoAviso} folio ${nota.folio}. Ingeniero asignado: ${nota.nombreIngeniero}.`,
                                detalles: detallesBase,
                                color: '#343a40'
                            });
                            console.log("Coordinador: ",c)
                            if(c==true){
                                avisoEmail+=`${nota.emailsCoordinadores.join(' ')} `
                            }
                            console.log("Coordinador: ",avisoEmail)
                        }
                        console.log("seguimiento: ")
                        await SeguimientoAviso.create({aviso:nota.aviso,usuario:nota.usuario,descripcion:avisoEmail})
                    } catch (e) { sails.log.error(e); }
                }
                
            });
            return res.status(200).send({ resp: 1, cantidad: avisosCreadosTotales});
    },
    buscarEquipos:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        /*let series=await Equipos.find({
                where: { numeroserie: { contains: req.query.serie },activo:1,baja:false,oficina:req.query.oficina},
                limit: 10,
                sort: 'serie ASC'
        }).populate('articulo');*/

        let equipos = await Equipos.find({where: { numeroserie: { contains: req.query.serie },activo:1,baja:false,
                or: [
                    { oficina: oficinaId }, 
                    { ubicacion: idsUbicacionesForaneas }          
                ]
            },
            limit: 5,
            sort: 'numeroserie ASC'
        }).populate('cliente').populate('ubicacion');
        if(equipos){
            res.status(200).send({ equipos,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningún equipo" });
        }
    },
    buscarUbicaciones:async function(req,res){
        let ub=await ClienteUbicacion.find({activo:1,cliente:req.query.id})
        let cliente=await Clientes.findOne({id:req.query.id})
        let ubicaciones
        if(cliente.oficina!=req.oficinaElegida.id){
            ubicaciones = ub.filter(e => {
                const ubicacionActiva = e.oficinaAtencion === req.oficinaElegida.id;
                return  ubicacionActiva;
            });
        }else{
            ubicaciones=ub
        }
        if(ubicaciones){
            res.status(200).send({ ubicaciones,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ninguna ubicación" });
        }
    },
    buscarContactos:async function(req,res){
        let contactos = await ClienteContacto.find({ubicacion:req.query.id,activo:1});
        let equipos=await Equipos.find({ubicacion:req.query.id,activo:1,baja:false});
        if(contactos){
            res.status(200).send({ contactos,resp:1,equipos });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningún contacto" });
        }
    },
    obtenerEquiposAgregar:async function(req,res){
        const idS = req.query.datos.map(u=>u.id);
        let prioridad=await Prioridad.find({activo:1})
        let tipoProblemas
        if(req.query.tipo==0){
            tipoProblemas=await TipoProblemas.find({activo:1})
        }else{
            tipoProblemas=await TipoProblemas.find({activo:1,tipoAvisos:req.query.tipo})
        }
        let equipo=await Equipos.find({id:idS});
        if(equipo){
            res.status(200).send({ equipo,resp:1,prioridad,tipoProblemas });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningún contacto" });
        }
    },
    obtenerEquipo:async function(req,res){
        let equipo = await Equipos.findOne({id:req.query.id});
        let prioridad=await Prioridad.find({activo:1})
        let tipoProblemas
        if(req.query.tipo==0){
            tipoProblemas=await TipoProblemas.find({activo:1})
        }else{
            tipoProblemas=await TipoProblemas.find({activo:1,tipoAvisos:req.query.tipo})
        }
        if(equipo){
            res.status(200).send({ equipo,resp:1,prioridad,tipoProblemas });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningún contacto" });
        }
    },
    buscarTipoProblemas:async function(req,res){
        let tipoProblemas
        if(req.query.id==0){
            tipoProblemas=await TipoProblemas.find({activo:1})
        }else{
            tipoProblemas=await TipoProblemas.find({activo:1,tipoAvisos:req.query.id})
        }
        if(tipoProblemas){
            res.status(200).send({ resp:1,tipoProblemas });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningún contacto" });
        }
    },
    buscarClientes:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsClientesForaneos = _.map(ubicacionesAtendidas, 'cliente');

        let clientes = await Clientes.find({where: { razonsocial: { contains: req.query.cliente },activo:1,
                or: [
                    { oficina: oficinaId }, 
                    { id: idsClientesForaneos }          
                ]
            },
            limit: 5,
            sort: 'razonsocial ASC'
        }).populate('oficina').populate('ubicaciones', {  where: { oficinaAtencion: oficinaId,activo:1 }});
        
        if(clientes){
            res.status(200).send({ clientes,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningun cliente" });
        }
    },
    tablaPendientes:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
            const params = req.allParams();

            // 1. Obtener ubicaciones foráneas
            const ubicacionesAtendidas = await ClienteUbicacion.find({ oficinaAtencion: oficinaId, activo: 1 });
            const idsUbicacionesForaneas = ubicacionesAtendidas.map(u => u.id);
        // 1. OBTENER IDS RELACIONADOS SI HAY BÚSQUEDA
        let matchingAvisoIds = null;
        if (params.search.value) {
            const search = params.search.value;
            
            // Buscamos en todas las relaciones en paralelo (solo traemos IDs)
            const [clientes, equiposMatch, problemasMatch, usuarios] = await Promise.all([
                Clientes.find({ razonsocial: { contains: search } }).select(['id']),
                Equipos.find({ numeroserie: { contains: search } }).select(['id']),
                TipoProblemas.find({ nombre: { contains: search } }).select(['id']),
                User.find({ or: [{ nombre: { contains: search } }, { apellido: { contains: search } }] }).select(['id'])
            ]);

            // Buscamos en la tabla intermedia AvisoEquipo para conectar equipos/problemas con Avisos
            const avisoEquipos = await AvisoEquipo.find({
                or: [
                    { equipo: equiposMatch.map(e => e.id) },
                    { tipoProblema: problemasMatch.map(p => p.id) }
                ]
            }).select(['aviso']);

            // Consolidamos todos los IDs de Avisos que coinciden
            matchingAvisoIds = _.uniq([
                ...avisoEquipos.map(ae => ae.aviso),
                // Aquí podrías filtrar el where principal por cliente/usuario en el paso siguiente
            ]);
        }

        // 2. CONSTRUIR EL WHERE PRINCIPAL
        let where = {
            activo: 1,
            estado: 'pendiente',
            or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }]
        };

        // Si hay búsqueda, aplicamos la intersección
        if (params.search.value) {
            const s = params.search.value;
            where.and = [
                { or: where.or }, // Mantenemos el filtro de oficina/ubicación
                { or: [
                    { id: matchingAvisoIds },
                    { folio: !isNaN(s) ? parseInt(s) : -1 },
                    // Búsqueda directa en relaciones que Waterline permite por ID
                    { cliente: (await Clientes.find({razonsocial: {contains: s}})).map(c => c.id) },
                    { atendidoPor: (await User.find({nombre: {contains: s}})).map(u => u.id) }
                ]}
            ];
            delete where.or; // Limpiamos para evitar conflictos con el 'and'
        }

        // 3. CONSULTA PAGINADA (Aquí está la magia de la velocidad)
        const totalRecords = await Avisos.count({ activo: 1, estado: 'pendiente', or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }] });
        const filteredCount = await Avisos.count(where);

        // 1. Mapeo de índices de DataTables a nombres de campos reales en la DB
        const columns = [
            'folio',          // Col 0
            'tipoAviso',      // Col 1 (Ojo: es relación, ver nota abajo)
            'prioridad',      // Col 2
            'createdAt',      // Col 3
            'fechaAtencion',  // Col 4
            'cliente',        // Col 5
            'id',             // Col 6 (Equipos - no ordenable en DB)
            'id',             // Col 7 (Problemas - no ordenable en DB)
            'atendidoPor'     // Col 8
        ];

        const colIdx = params.order[0].column;
        const colDir = params.order[0].dir.toUpperCase(); // ASC o DESC
        let sortCriteria = '';

        // 2. Definir criterio de ordenamiento
        const targetCol = columns[colIdx];

        // Evitar ordenar por relaciones complejas en DB que Sails no soporta nativamente
        const esRelacion = ['tipoAviso', 'prioridad', 'cliente', 'atendidoPor'].includes(targetCol);

        if (esRelacion) {
            // Orden por defecto si es relación para evitar el error "Cannot populate and sort"
            sortCriteria = ` createdAt: ${colDir} `; 
        } else {
            sortCriteria = ` ${targetCol} ${colDir} `;
        }

        const avisos = await Avisos.find(where)
            .populate('cliente').populate('ubicacion').populate('atendidoPor')
            .populate('tipoAviso').populate('prioridad')
            .skip(parseInt(params.start))
            .limit(parseInt(params.length))
            .sort(sortCriteria); // Para orden dinámico ver nota abajo*

        // 4. POBLADO DE EQUIPOS SOLO PARA LOS 10 O 25 REGISTROS VISIBLES
        const data = await Promise.all(avisos.map(async (aviso) => {
            const detalles = await AvisoEquipo.find({ aviso: aviso.id }).populate('tipoProblema').populate('equipo');
            return {
                id: aviso.folio,
                tipoAviso: aviso.tipoAviso?.nombre || '',
                prioridad: `<span class="badge" style="background-color:${aviso.prioridad?.color}">${aviso.prioridad?.nombre}</span>`,
                fechaAlta: moment(aviso.createdAt).format('DD/MM/YYYY HH:mm'),
                fechaPrevista: moment(aviso.fechaprevista).format('DD/MM/YYYY HH:mm'),
                cliente: `<b>${aviso.cliente?.razonsocial}</b>`,
                equipos: detalles.map(d => d.equipo?.numeroserie).join('<br>'),
                problemas: detalles.map(d => d.tipoProblema?.nombre).join('<br>'),
                atiende: aviso.atendidoPor?.nombre || 'Sin asignar'
            };
        }));
        console.log("Datos: ",data)
        return res.json({ draw: params.draw, recordsTotal: totalRecords, recordsFiltered: filteredCount, data });

    },
    tablaPendientesOld: async function(req, res) {
        if (!req.isSocket && req.method !== 'POST') {
            return res.view("pages/avisos/pendientes");
        }

        try {
            const oficinaId = req.oficinaElegida.id;
            const params = req.allParams();
            const search = params.search.value;

            // 1. Obtener ubicaciones foráneas
            const ubicacionesAtendidas = await ClienteUbicacion.find({ oficinaAtencion: oficinaId, activo: 1 });
            const idsUbicacionesForaneas = ubicacionesAtendidas.map(u => u.id);

            // --- LÓGICA DE BÚSQUEDA EN RELACIONES ---
            let filterIds = null;
            if (search) {
                // Buscamos IDs en tablas relacionadas que coincidan con el texto
                const [problemasMatch, equiposMatch] = await Promise.all([
                    TipoProblemas.find({ nombre: { contains: search } }).select(['id']),
                    Equipos.find({ numeroserie: { contains: search } }).select(['id'])
                ]);

                // 2. Extraemos los IDs obtenidos
                const idsP = problemasMatch.map(p => p.id);
                const idsE = equiposMatch.map(e => e.id);
                const [clientes, equiposDetalle, usuarios] = await Promise.all([
                    Clientes.find({ razonsocial: { contains: search } }).select(['id']),
                    AvisoEquipo.find({ 
                        or: [
                            { tipoProblema: idsP },
                            {equipo:idsE} // Nota: Esto requiere populate o filtrar por IDs previos
                            // Si buscas por serie, es mejor buscar en el modelo Equipo primero
                        ]
                    }).populate('equipo').select(['aviso']),
                    User.find({ nombre: { contains: search } }).select(['id'])
                ]);

                // Consolidamos todos los IDs de Avisos que coinciden con los criterios relacionales
                const avisoIdsRelacionados = equiposDetalle.map(ed => ed.aviso);
                const clienteIds = clientes.map(c => c.id);
                const usuarioIds = usuarios.map(u => u.id);

                // Filtro dinámico para el WHERE principal
                filterIds = { 
                    or: [
                        { cliente: clienteIds },
                        { atendidoPor: usuarioIds },
                        { id: avisoIdsRelacionados },
                        { folio: isNaN(search) ? -1 : parseInt(search) }
                    ]
                };
            }

            // --- LÓGICA DE ORDENAMIENTO DINÁMICO ---
            const colIndex = params.order[0].column;
            const colDir = params.order[0].dir;
            const colNameMap = ['folio', 'tipoAviso', 'prioridad', 'createdAt', 'fechaAtencion', 'cliente', 'id', 'id', 'atendidoPor'];
            let sortOrder = `${colNameMap[colIndex]} ${colDir.toUpperCase()}`;

            // 2. Filtro Base
            let where = {
                activo: 1,
                estado: 'pendiente',
                or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }]
            };

            // Si hubo búsqueda, aplicamos la intersección de filtros
            if (filterIds) {
                where = { and: [ where, filterIds ] };
            }

            // 3. Consultas a DB
            const totalRecords = await Avisos.count({ activo: 1, estado: 'pendiente', or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }] });
            const filteredRecords = await Avisos.count(where);
            
            const avisos = await Avisos.find(where)
                .populate('cliente').populate('ubicacion').populate('atendidoPor')
                .populate('tipoAviso').populate('prioridad').populate('equiposInvolucrados')
                .skip(parseInt(params.start))
                .limit(parseInt(params.length))
                .sort(sortOrder);

            // 4. Mapeo de Datos (Igual al ejemplo anterior pero inyectando detalles de equipos)
            const data = await Promise.all(avisos.map(async (aviso) => {
                const detalles = await AvisoEquipo.find({ aviso: aviso.id }).populate('tipoProblema').populate('equipo');
                return {
                    id: aviso.folio,
                    tipoAviso: aviso.tipoAviso?.nombre || 'N/A',
                    prioridad: `<span class="badge" style="background-color:${aviso.prioridad?.color}">${aviso.prioridad?.nombre}</span>`,
                    fechaAlta: moment(aviso.createdAt).format('DD/MM/YYYY HH:mm'),
                    fechaPrevista: moment(Number(aviso.fechaAtencion)).format('DD/MM/YYYY HH:mm'),
                    cliente: `<b>${aviso.cliente?.razonsocial}</b><br><small>${aviso.ubicacion?.nombre}</small>`,
                    equipos: detalles.map(d => `${d.equipo?.numeroserie} (${d.equipo?.modelo})`).join('<br>'),
                    problemas: detalles.map(d => d.tipoProblema?.nombre).join('<br>'),
                    atiende: aviso.atendidoPor ? aviso.atendidoPor.nombre : 'Sin asignar'
                };
            }));
            console.log("Datos",data)
            return res.json({
                draw: parseInt(params.draw),
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data: data
            });

        } catch (err) {
            sails.log.error(err);
            return res.serverError(err);
        }
    },
    finalizados:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        const avisos = await Avisos.find({ where: {activo:1,estado:'finalizado',or: [{ oficina: oficinaId },{ ubicacion: idsUbicacionesForaneas } ]}}).populate('cliente').populate('ubicacion').populate('oficina').populate('atendidoPor').populate('tipoAviso').populate('prioridad').populate('equiposInvolucrados')
        await Promise.all(
            avisos.map(async (aviso)=>{
                aviso.equiposInvolucrados=await Promise.all(
                    aviso.equiposInvolucrados.map(async (eo) => {
                        let equipos=await AvisoEquipo.findOne({id:eo.id}).populate('tipoProblema').populate('equipo')
                        
                        let datos={
                            tipoProblema:equipos.tipoProblema.nombre,
                            serie:equipos.equipo.numeroserie,
                            marca:equipos.equipo.marca,
                            modelo:equipos.equipo.modelo,
                            descripcion:equipos.equipo.descripcion
                        }
                        eo.equipo = datos;
                        return eo;
                    })
                )
            })
        );
        return res.view("pages/avisos/finalizados",{avisos});
    },
    vistaCalendario: async function (req, res) {
        let ingenieros = await User.find({ activo: 1 }); // Ajustar según tu tabla de roles
        return res.view("pages/avisos/calendario", { ingenieros });
    }, 
    eventosCalendario: async function (req, res) {
        let query = {
            oficina: req.user.oficina
        };
        if (req.query.ingenieroId && req.query.ingenieroId !== 'todos') {
            query.atendidoPor = req.query.ingenieroId;
        }

        let avisos = await Avisos.find(query).populate('atendidoPor').populate('cliente');
        
        
        let eventos = await Promise.all(avisos.map(async a => {
            const esFin = a.estado === 'finalizado';
            // REGLA: Si no tiene fechaFin o la hora es 00:00 (o el criterio que uses para "sin hora")
            // los mandamos a la sección superior "allDay"
            const sinHoraDefinida = !a.fechaFin || moment(a.fechaAtencion).format('HH:mm') === '00:00';
            let usuario=await User.findOne({id:a.atendidoPor.id});
            return {
                id: a.id,
                title: (sinHoraDefinida ? '[ASIGNAR] ' : '') + (a.cliente ? a.cliente.razonsocial : 'S/C'),
                start: a.fechaAtencion,
                end: a.fechaFin,
                allDay:sinHoraDefinida,
                backgroundColor: sinHoraDefinida ? '#6c757d' :(esFin ? '#d1d1d1' : (a.atendidoPor.color || '#007bff')),
                borderColor: esFin ? '#b0b0b0' : (a.atendidoPor.color || '#007bff'),
                textColor: esFin ? '#666' : '#fff',
                extendedProps: { folio: a.folio, ingeniero: usuario.nombre, estado: a.estado,requireProgramacion:sinHoraDefinida,ingenieroId:usuario.id }
            };
        }));
        return res.json(eventos);
    },
    validarYMover: async function (req, res) {
        const { id, fechaAtencion, atendidoPor } = req.body;
        const ahora=new Date();
        const inicioDeseado = new Date(fechaAtencion);
        if (inicioDeseado < ahora) {
            return res.status(400).json({ 
                message: 'No se puede programar un aviso para un horario o fecha que ya pasó.' ,
                titulo:'Conflicto de horario'
            });
        }
        // 2. Obtener datos del aviso, oficina y duración técnica
        const aviso = await Avisos.findOne({ id }).populate('oficina');
        const oficina = aviso.oficina; 
        const equipos = await AvisoEquipo.find({ aviso: id }).populate('tipoProblema');
        if(aviso.estado=="finalizado") return res.status(400).json({ message: 'El aviso esta finalizado no se puede volver a programar.',titulo:'Aviso finalizado' });
        if (!oficina) return res.status(400).json({ message: 'No se encontró la oficina asociada al aviso.',titulo:'Oficina no encontrada' });

        let minutosTotales = 0;
        equipos.forEach(e => {
            if (e.tipoProblema && e.tipoProblema.duracion) {
                const [h, m] = e.tipoProblema.duracion.split(':').map(Number);
                minutosTotales += (h * 60) + m;
            }
        });

        // Si por alguna razón no tiene equipos, asignamos 30 min por defecto
        if (minutosTotales === 0) minutosTotales = 30;

        const finDeseado = new Date(inicioDeseado.getTime() +(minutosTotales * 60000));

        // 3. VALIDACIÓN DE HORARIO LABORAL
        const diaSemana = inicioDeseado.getDay(); // 0: Dom, 1: Lun... 6: Sab
        if (diaSemana === 0) return res.status(400).json({ message: 'No se pueden programar avisos en domingo.',titulo:'Domingo' });

        const esSabado = (diaSemana === 6);
        const horaEntradaStr = esSabado ? oficina.horariosabadoentrada : oficina.horariolventrada;
        const horaSalidaStr = esSabado ? oficina.horariosabadosalida : oficina.horariolvsalida;

        // Crear objetos fecha para comparar horas del mismo día
        const [hE, mE] = horaEntradaStr.split(':').map(Number);
        const [hS, mS] = horaSalidaStr.split(':').map(Number);

        const limiteEntrada = new Date(inicioDeseado); limiteEntrada.setHours(hE, mE, 0, 0);
        const limiteSalida = new Date(inicioDeseado); limiteSalida.setHours(hS, mS, 0, 0);

        if (inicioDeseado < limiteEntrada) {
            return res.status(400).json({ message: `La oficina inicia labores a las ${horaEntradaStr}.`,titulo:'Conflicto de horario' });
        }
        if (inicioDeseado > limiteSalida) {
            return res.status(400).json({ message: `El aviso inicia después de la hora de salida (${horaSalidaStr}), por lo tanto, no se puede asignar en ese horario`,titulo:'Conflicto de horario' });
        }

        // Buscar si el ingeniero tiene otro aviso que se traslape
        const choque = await Avisos.findOne({
            id: { '!=': id },
            atendidoPor: atendidoPor,
            fechaAtencion: { '<': finDeseado },
            fechaFin: { '>': inicioDeseado }
        });

        // 4. Obtener el color del ingeniero asignado para actualizar la vista
        const ingeniero = await User.findOne({ id: atendidoPor });
        const nuevoColor = ingeniero ? ingeniero.color : '#007bff';

        if (choque) {
            return res.status(400).json({ message: `El ingeniero ya tiene el aviso #${choque.folio} en ese horario.`,titulo:'Conflicto de horario' });
        }

        await Avisos.updateOne({ id }).set({ fechaAtencion: inicioDeseado, fechaFin: finDeseado });
        return res.json({ nuevaFechaFin: finDeseado,nuevoColor });
    },
    modificarProgramacionManual: async function (req, res) {
        try {
            const { idAviso, ingeniero, manualFechaInicio, manualFechaFin } = req.allParams();
            const ahora = new Date();
            const inicio = new Date(manualFechaInicio);
            const fin = new Date(manualFechaFin);

            // 1. Validaciones básicas
            if (!idAviso || ingeniero === '0') {
                return res.status(400).json({ message: 'Debe seleccionar un ingeniero válido.' });
            }
            if (inicio < ahora) {
                return res.status(400).json({ message: 'No puedes programar en una fecha/hora que ya pasó.' });
            }
            if (fin <= inicio) {
                return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
            }


            // 2. Obtener Oficina para validar horario laboral
            const aviso = await Avisos.findOne({ id: idAviso }).populate('oficina');
            if (!aviso || !aviso.oficina) {
                return res.status(400).json({ message: 'No se encontró la oficina para validar el horario.' });
            }

            const oficina = aviso.oficina;
            const diaSemana = inicio.getDay(); // 0: Dom, 6: Sab

            if (diaSemana === 0) {
                return res.status(400).json({ message: 'No se puede programar avisos en domingo.' });
            }

            // Determinar límites según el día
            const esSabado = (diaSemana === 6);
            const hEntradaStr = esSabado ? oficina.horariosabadoentrada : oficina.horariolventrada;
            const hSalidaStr = esSabado ? oficina.horariosabadosalida : oficina.horariolvsalida;

            const [hE, mE] = hEntradaStr.split(':').map(Number);
            const [hS, mS] = hSalidaStr.split(':').map(Number);

            // Crear objetos de comparación para el mismo día
            const limiteEntrada = new Date(inicio); limiteEntrada.setHours(hE, mE, 0, 0);
            const limiteSalida = new Date(inicio); limiteSalida.setHours(hS, mS, 0, 0);

            // VALIDACIÓN: El inicio debe estar dentro del rango, el fin puede ser después
            if (inicio < limiteEntrada || inicio >= limiteSalida) {
                return res.status(400).json({ 
                    message: `El inicio de atención debe estar dentro del horario de la oficina (${hEntradaStr} a ${hSalidaStr}).` 
                });
            }

            // 2. Validación de Colisión (Traslape)
            // Buscamos si el ingeniero tiene otro aviso en ese rango
            const choque = await Avisos.findOne({
                id: { '!=': idAviso },
                atendidoPor: ingeniero,
                fechaAtencion: { '<': fin },
                fechaFin: { '>': inicio }
            });

            if (choque) {
                return res.status(400).json({ 
                    message: `El ingeniero ya tiene un aviso programado (#${choque.folio}) que coincide con este horario.` 
                });
            }

            // 3. Obtener datos del nuevo ingeniero (para el color en el calendario)
            const datosIngeniero = await User.findOne({ id: ingeniero });

            // 4. Actualizar Aviso
            const avisoActualizado = await Avisos.updateOne({ id: idAviso }).set({
                atendidoPor: ingeniero,
                fechaAtencion: inicio,
                fechaFin: fin
            });

            return res.json({
                message: 'Programación actualizada con éxito',
                nuevoColor: datosIngeniero ? datosIngeniero.color : '#007bff',
                ingenieroNombre: datosIngeniero ? datosIngeniero.nombre : '',
                fechaFin: fin
            });

        } catch (err) {
            return res.serverError(err);
        }
    },
    obtener:async function(req,res){
        let aviso=await Avisos.findOne({id:req.query.id}).populate('cliente');
        if(aviso){
            res.status(200).send({ aviso,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado el aviso" });
        }
    },
    cerrar:async function(req,res){
        let aviso=await Avisos.findOne({id:req.query.id}).populate('oficina')
        if(!aviso) return res.notFound();

        let fechaCierre = moment().tz("America/Mexico_City");
        let fechaInicio = moment(aviso.createdAt).tz("America/Mexico_City");
        let minutosTotales = 0;
        console.log(fechaInicio)

        // 2. LÓGICA DE CÁLCULO
        if (req.query.intervencion == 0) {
            // SIN INTERVENCIÓN: Calcular minutos solo dentro de horario laboral
            minutosTotales=await calcularMinutos(fechaInicio,fechaCierre,aviso.oficina);
            let fechaActual = fechaCierre.format('YYYY-MM-DD HH:mm:ss');
            await Avisos.updateOne({id:req.query.id}).set({estado:'finalizado',fechaCierre:fechaActual,tiemposolucion:60,tiemporespuesta:minutosTotales});
        }else{
             await Avisos.updateOne({id:req.query.id}).set({estado:'finalizado',fechaCierre:fechaActual});
        }
        await SeguimientoAviso.create({aviso:aviso.id,usuario:req.session.usuario.id,descripcion:'Aviso cerrado'})
        res.status(200).send({ });
    },
    reabrir:async function(req,res){
        let avisos=await Avisos.updateOne({id:req.query.id}).set({estado:'pendiente',fechaCierre:null});
        await SeguimientoAviso.create({aviso:avisos.id,usuario:req.session.usuario.id,descripcion:'Aviso reabierto'})
        res.status(200).send({ });
    },
    iniciarAtencion:async function(req,res){
        const moment = require('moment-timezone');
        console.log("oficinaElegida",req.oficinaElegida)
        let intervencionId=0
        let plantilla
        if(req.params.intervencion){
            intervencionId=req.params.intervencion
        }
        let a=await AvisoEquipo.findOne({id:req.params.equipoAviso});
        let horaInicioAtencion = moment().tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss');
        //console.log("datos:",a)
        //console.log("Primero:",a.fechaInicio)
        if(a.fechaInicio==null){
            //console.log("segundo:",a.fechaInicio)
            await AvisoEquipo.updateOne({id:req.params.equipoAviso}).set({fechaInicio:horaInicioAtencion});
            //console.log("tercero:",a.fechaInicio)
            if(intervencionId==0){
                await Avisos.updateOne({id:a.aviso}).set({fechaInicio:horaInicioAtencion});
                //console.log("cuarto:",a.fechaInicio)
            }
        }
        let aviso=await Avisos.findOne({id:req.params.aviso}).populate('ubicacion').populate('cliente')
        let avisoEquipo=await AvisoEquipo.findOne({id:req.params.equipoAviso}).populate('tipoProblema');
        let equipo=await Equipos.findOne({id:avisoEquipo.equipo});
        let contInt=await IntervencionEquipo.count({equipo:equipo.id,aviso:aviso.id});
        let tipoContadores=await TipoContadores.find({activo:1,tipoAvisos:aviso.tipoAviso});
        if(contInt>0){
            req.addFlash('mensaje', 'No se puede iniciar la atención de este aviso porque ya esta en una intervención, para cambiar valores, tienes que editar esa intervención');
            return res.redirect(`/avisos/${aviso.id}`);
        }
        let contactos=await ClienteContacto.find({cliente:aviso.cliente.id,ubicacion:aviso.ubicacion.id,activo:1})
        if(aviso.tipoAviso==1){
            plantilla=await Plantillas.findOne({activo:1}).populate('campos');
        }
        console.log("Plantillas: ",plantilla)
        if (aviso.oficina!=req.oficinaElegida.id && aviso.ubicacion.oficinaAtencion!=req.oficinaElegida.id&&aviso.atendidoPor!=req.session.usuario.id) {
            return res.view("pages/avisos/atender",{aviso,contactos,equipo,avisoEquipo,tipoContadores,intervencionId,permiso:0,plantilla});
        }
        return res.view("pages/avisos/atender",{aviso,contactos,equipo,avisoEquipo,tipoContadores,intervencionId,permiso:1,plantilla});
    },
    buscarArticulo:async function(req,res){
        try {
            const query = req.query.q;
            if (!query || query.length < 3) return res.json([]);

            const usuarioId = req.session.usuario.id;
            const oficinaId = req.oficinaElegida.id;

            // 1. Buscamos primero los artículos que coinciden con el código
            const articulosCoincidentes = await Articulos.find({
            where: { codigo: { contains: query } },
            select: ['id', 'codigo', 'descripcion', 'preciopublico']
            });

            if (articulosCoincidentes.length === 0) return res.json([]);

            // Extraemos solo los IDs
            const idsArticulos = articulosCoincidentes.map(a => a.id);

            // 2. Buscamos el stock del usuario que pertenezca a esos artículos
            const stockResultados = await StockUsuario.find({
            usuario: usuarioId,
            oficina: oficinaId,
            articulo: idsArticulos, // Filtramos por el set de IDs encontrados
            cantidad: { '>': 0 }
            }).populate('articulo'); // Aquí ya no pasamos subcriterios

            // 3. Formateamos la respuesta final
            const respuesta = stockResultados.map(item => {
            return {
                id: item.articulo.id,
                nombre: `${item.articulo.codigo} - ${item.articulo.descripcion}`,
                existencia: item.cantidad,
                costopromedio: item.costopromedio,
                preciopublico: item.articulo.preciopublico
            };
            }).slice(0, 5);

            return res.json(respuesta);

        } catch (err) {
            sails.log.error('Error en búsqueda de materiales:', err);
            return res.serverError(err);
        }
    },
    equipoAtenderGuardar:async function(req,res){
        const datos = req.allParams();
        let intervencion
      
        // 1. Formatear Hora de Inicio y obtener Hora de Fin (Actual)
        const zonaHoraria = "America/Mexico_City";
        const horaInicio = moment(new Date(datos.horaInicio)).tz(zonaHoraria);
        const horaFin = moment().tz(zonaHoraria);

        // 2. Calcular diferencia en minutos
        // .diff devuelve la diferencia. 'minutes' asegura que sea un entero.
        const minutosAtencion = horaFin.diff(horaInicio, 'minutes');
        let minutosTotales=0;
        const aviso=await Avisos.findOne({id:req.body.avisoId}).populate('oficina');
        await sails.getDatastore().transaction(async (db) => {
            const tecnico = await User.findOne({id: req.session.usuario.id}).usingConnection(db);
            
            const avisoEquipo=await AvisoEquipo.findOne({id:req.body.avisoEquipoId}).usingConnection(db);
            let fechaInicio=moment(aviso.createdAt).tz("America/Mexico_City");
            let fech=aviso.fechaInicio;
            //console.log(fech)
            //console.log("aviso",aviso)
            //let fechaCierre=moment(aviso.fechaInicio, "YYYY-MM-DD HH:mm:ss").tz("America/Mexico_City")
            let fechaCierre=moment(aviso.fechaInicio).tz("America/Mexico_City")
            minutosTotales=await calcularMinutosSincomida(fechaInicio,fechaCierre,aviso.oficina,tecnico.horacomida)
            //Crear intervención u obtener el valor si ya existe
            
            if(req.body.intervencion==0){
                intervencion=await Intervenciones.create({fechaInicio:aviso.fechaInicio,tiemporespuesta:minutosTotales,atendidoPor:req.session.usuario.id,aviso:aviso.id,tipoAviso:aviso.tipoAviso,oficina:aviso.oficina.id,cliente:aviso.cliente,ubicacion:aviso.ubicacion,estado:'pendiente',trEstimado:aviso.trEstimado,trPoliza:aviso.trPoliza}).fetch().usingConnection(db);
                //Actualizar tiempo de respuesta en aviso
                await Avisos.updateOne({id:aviso.id}).set({tiemporespuesta:minutosTotales}).usingConnection(db)
            }else{
                intervencion=await Intervenciones.findOne({id:req.body.intervencion}).usingConnection(db);
            }
            let plantilla=null
            //Datos de plantilla
            if(aviso.tipoAviso==1){
                if(req.body.plantilla){
                    plantilla = {
                        plantillaNombre: req.body.plantilla.nombre,
                        fechaRegistro: new Date().toISOString(),
                        campos: req.body.plantilla.campos.map(c => ({
                            id: c.id,
                            nombre: c.nombre,
                            tipo: c.tipo,
                            valor: c.valor
                        }))
                    }
                }
            }
            //crear intervencionEquipo
            const equipo=await IntervencionEquipo.create({fechaInicio:horaInicio.format('YYYY-MM-DD HH:mm:ss'),fechaCierre:horaFin.format('YYYY-MM-DD HH:mm:ss'),tiemposolucion:minutosAtencion,tiemporespuesta:minutosTotales,observaciones:req.body.observaciones,notas:req.body.estadoEquipo,equipo:req.body.equipoId,intervencion:intervencion.id,avisoEquipo:req.body.avisoEquipoId,atendidoPor:req.session.usuario.id,aviso:aviso.id,tipoAviso:aviso.tipoAviso,oficina:aviso.oficina.id,cliente:aviso.cliente,ubicacion:aviso.ubicacion,tipoProblema:avisoEquipo.tipoProblema,trEstimado:aviso.trEstimado,trPoliza:aviso.trPoliza,plantilla}).fetch().usingConnection(db);
            //Actualizar datos en el avisoequipo para el estado
            await AvisoEquipo.updateOne({id:req.body.avisoEquipoId}).set({tiemposolucion:minutosAtencion,tiemporespuesta:minutosTotales,estado:req.body.estadoEquipo,estadoEquipo:'atendido',fechaCierre:horaFin.format('YYYY-MM-DD HH:mm:ss')}).usingConnection(db);
            //Crear intervencionContadores
            let contadores=req.body.contadores
const idsContadoresActuales = contadores.filter(c => c.name !== 'estado').map(c => c.name);

// Creamos un mapa para traducir ID -> Nombre (ej: "507" -> "Monocromo")
const mapaTipos = {};
const tiposInfo = await TipoContadores.find({ id: idsContadoresActuales }).usingConnection(db);
tiposInfo.forEach(t => { mapaTipos[t.id] = t.nombre; });

let datosPrevios = {};
console.log("mapas: ",mapaTipos)
console.log("-------------------------------------------")
if (aviso.tipoAviso == 3) {
    // 2. Intentar buscar la última lectura formal (Tipo 3)
    const ultimaIntervencionTipo3 = await IntervencionContadores.find({
        equipo: req.body.equipoId,
        tipoAviso: 3,
        tipoContador:1,
        intervencion: { '!=': intervencion.id }
    }).sort('createdAt DESC').limit(1).usingConnection(db);

    let fechaReferencia;
    let existeLecturaPrevia = false;

    if (ultimaIntervencionTipo3.length > 0) {
        fechaReferencia = ultimaIntervencionTipo3[0].createdAt;
        existeLecturaPrevia = true;
    } else {
        // Si no hay lectura anterior, retrocedemos 35 días desde "ahora"
        let d = new Date();
        d.setDate(d.getDate() - 35);
        fechaReferencia = d;
        existeLecturaPrevia = false;
    }

    // 3. Traer historial (sea desde la lectura anterior o desde hace 35 días)
    const historial = await IntervencionContadores.find({
        equipo: req.body.equipoId,
        tipoAviso: [1, 2, 3],
        createdAt: { '>=': fechaReferencia }
    }).populate('tipoContador').usingConnection(db);
    console.log("historial: ",historial)
    // 4. Procesar cada contador actual
    console.log("-------------------------------------------")
    idsContadoresActuales.forEach(idActual => {
        const nombreBusqueda = mapaTipos[idActual];
        
        // Filtramos el historial que coincida con el NOMBRE del contador
        const registrosMismoNombre = historial.filter(h => h.tipoContador && h.tipoContador.nombre === nombreBusqueda);
        console.log("registrosMismoNombre:",registrosMismoNombre)

        // Valor Anterior: Solo si existe lectura previa tipo 3, si no, es 0
        let valorAnterior = 0;
        if (existeLecturaPrevia) {
            const regTipo3Anterior = registrosMismoNombre.find(r => r.tipoAviso == 3);
            valorAnterior = regTipo3Anterior ? regTipo3Anterior.valor : 0;
        }

        // BONIFICACIÓN: Calculamos sobre avisos 1 y 2 encontrados en el rango de fecha
        const intervencionesMantenimiento = [...new Set(registrosMismoNombre
            .filter(r => r.tipoAviso != 3)
            .map(r => r.intervencion))];

        let totalBonificacion = 0;
        console.log("intervencionesMantenimiento",intervencionesMantenimiento)
        intervencionesMantenimiento.forEach(intId => {
            const pasos = registrosMismoNombre.filter(r => r.intervencion == intId);
            console.log("pasos: ",pasos)
            const entrada = pasos.find(p => p.tipoContador.tipocontador === 'Entrada');
            const salida = pasos.find(p => p.tipoContador.tipocontador === 'Salida');
            console.log("Entrada y Salida",entrada,salida)
            if (entrada && salida) {
                const diff = Number(salida.valor) - Number(entrada.valor);
                if (diff > 0) totalBonificacion += diff;
            }
            console.log("-------------------------------------------")
        });

        datosPrevios[idActual] = {
            valorAnterior: valorAnterior,
            bonificacion: totalBonificacion
        };
    });
}

console.log("datosprevios: ",datosPrevios)
for (let c of contadores) {
    if (c.name === 'estado') continue;

    const calculos = datosPrevios[c.name] || { valorAnterior: 0, bonificacion: 0 };
    const valorActual = Number(c.value);
    let procesado = 0;

    if (aviso.tipoAviso == 3) {
        // Cálculo solicitado: (Actual - Anterior) - Bonificación
        procesado = (valorActual - calculos.valorAnterior) - calculos.bonificacion;
    }

    await IntervencionContadores.create({
        valor: valorActual,
        valorAnterior: calculos.valorAnterior,
        bonificacion: calculos.bonificacion,
        procesado: procesado,
        tipoContador: c.name,
        // ... (resto de tus campos de relación)
        equipo: req.body.equipoId,
        intervencion: intervencion.id,
        avisoEquipo: req.body.avisoEquipoId,
        atendidoPor: req.session.usuario.id,
        aviso: aviso.id,
        tipoAviso: aviso.tipoAviso,
        oficina: aviso.oficina.id,
        cliente: aviso.cliente,
        ubicacion: aviso.ubicacion,
        intervencionEquipo: equipo.id
    }).usingConnection(db);
}
            /*for(let c of contadores){
                if (c.name === 'estado') continue;
                await IntervencionContadores.create({valor:c.value,tipoContador:c.name,equipo:req.body.equipoId,intervencion:intervencion.id,avisoEquipo:req.body.avisoEquipoId,atentidoPor:req.session.usuario.id,aviso:aviso.id,tipoAviso:aviso.tipoAviso,oficina:aviso.oficina.id,cliente:aviso.cliente,ubicacion:aviso.ubicacion,intervencionEquipo:equipo.id}).usingConnection(db)
            };*/
            //Crear materiales y descontar de las existencias
            if(aviso.tipoAviso!=3){
                let materiales=req.body.materiales
                if (materiales && Array.isArray(materiales) && materiales.length > 0) {
                //if(materiales.length>0){
                    for(let m of materiales){
                        let articulo=await StockUsuario.findOne({articulo:m.id,oficina:req.oficinaElegida.id,usuario:req.session.usuario.id}).populate('articulo').usingConnection(db);
                        await StockUsuario.updateOne({ id: articulo.id }).set({ cantidad: Number(articulo.cantidad) - Number(m.cantidad) }).usingConnection(db);
                        //console.log("materiales: ",m)
                        //console.log("tecnico: ",tecnico)
                        let contador=0;
                        if(aviso.tipoAviso==4){
                            console.log("Entra a tipo aviso")
                            let tcon=await TipoContadores.findOne({tipoAvisos:aviso.tipoAviso,nombre:articulo.articulo.tipocolor,activo:1});
                            let contadorEncontrado = contadores.find(c => Number(c.name) == Number(tcon.id));
                            console.log("Contadores: ",contadores)
                            contador=contadorEncontrado.value
                            console.log("Contador:",contadorEncontrado.value)
                        }
                        await IntervencionArticulos.create({
                            cantidad:m.cantidad,
                            costopromedio:articulo.costopromedio,
                            costopublico:m.preciopublico,
                            articulo:m.id,
                            contador:contador,
                            equipo:req.body.equipoId,intervencion:intervencion.id,avisoEquipo:req.body.avisoEquipoId,atendidoPor:req.session.usuario.id,aviso:aviso.id,tipoAviso:aviso.tipoAviso,oficina:aviso.oficina.id,cliente:aviso.cliente,ubicacion:aviso.ubicacion,intervencionEquipo:equipo.id,tipoAviso:aviso.tipoAviso}).usingConnection(db)
                        await MovimientoInventario.create({
                                tipo: 'USO_INTERNO',
                                cantidad: m.cantidad,
                                articulo: m.id,
                                oficina: req.oficinaElegida.id,
                                usuarioResponsable: req.session.usuario.id,
                                usuarioAsignado: req.session.usuario.id,
                                costoAplicado:articulo.costopromedio,
                                concepto: `Salida por Uso en intervención #${intervencion.id}`
                            }).usingConnection(db);
                    }
                }
            }
            //console.loggg(fechaInicio)
            //console.log(fechaCierre)
            //console.log(minutosTotales)
        })
        let pendientes = await AvisoEquipo.find({
            aviso: aviso.id,
            estadoEquipo: 'pendiente' // O el estado que manejes para los no atendidos
        }).limit(1);
        let siguientePendiente=pendientes[0]
        if (siguientePendiente) {
            // Si hay uno pendiente, devolvemos los IDs para que el cliente redireccione
            return res.json({
                status: 'next',
                avisoId: aviso.id,
                avisoEquipoId: siguientePendiente.id,
                intervencionId:intervencion.id,
                message: 'Equipo registrado. Procediendo al siguiente equipo pendiente.'
            });
        } else {
            // Si no hay más pendientes, enviamos la señal de finalizar intervención
            return res.json({
                status: 'finish',
                avisoId: aviso.id,
                intervencionId:intervencion.id,
                message: 'Todos los equipos han sido atendidos.'
            });
        }
    },
    equipoAtenderGuardarPendiente:async function(req,res){
        const datos = req.allParams();
        let estado="pendiente";
        let status="finish"
        let intervencion=await Intervenciones.findOne({id:req.body.intervencion});
      
        // 1. Formatear Hora de Inicio y obtener Hora de Fin (Actual)
        const zonaHoraria = "America/Mexico_City";
        const horaInicio = moment(new Date(datos.horaInicio)).tz(zonaHoraria);
        const horaFin = moment().tz(zonaHoraria);

        // 2. Calcular diferencia en minutos
        // .diff devuelve la diferencia. 'minutes' asegura que sea un entero.
        const minutosAtencion = horaFin.diff(horaInicio, 'minutes');
        let minutosTotales=0;
        const aviso=await Avisos.findOne({id:req.body.avisoId}).populate('oficina');
        await sails.getDatastore().transaction(async (db) => {
            await IntervencionEquipo.updateOne({id:req.body.idEquipoInt}).set({observaciones:req.body.observaciones,notas:req.body.estadoEquipo}).usingConnection(db);
            if(req.body.estadoEquipo=="Operativo"){
                estado='finalizado'
            }
            await AvisoEquipo.updateOne({id:req.body.avisoEquipoId}).set({estado:req.body.estadoEquipo,estadoEquipo:'atendido'}).usingConnection(db);
            console.log("estado: ",estado)
            let siguientePendiente = await AvisoEquipo.find({
                aviso:req.body.avisoId,
                estado:{'!=': 'Operativo'} 
            }).usingConnection(db);
            console.log("Siguiente",siguientePendiente,"cant:",siguientePendiente.length)
            if(siguientePendiente.length>0){
                console.log("Mayor")
                status='next'
            }else{
                console.log("Igual")
                await Intervenciones.updateOne({id:intervencion.id}).set({estado:estado,estadoEquipo:'atendido'}).usingConnection(db);
                await Avisos.updateOne({id:intervencion.aviso}).set({estado:estado,estadoEquipo:'atendido'}).usingConnection(db);
            }
        })
        return res.json({
            status:status,
            avisoId: req.body.avisoId,
            intervencionId:intervencion.id,
            message: 'Equipo modificado. Procediendo a la ficha del aviso.'
        });
    },
    finalizarIntervencion: async function (req, res) {
        try {
            const idIntervencion = req.param('id');

            // 1. Carga inicial: Intervención y Equipos (en paralelo)
            const [intervencion, equiposAtendidos] = await Promise.all([
                Intervenciones.findOne({ id: idIntervencion }).populate('cliente').populate('ubicacion').populate('aviso'),
                IntervencionEquipo.find({ intervencion: idIntervencion }).populate('equipo').populate('contadores').populate('articulos')
            ]);

            if (!intervencion) return res.redirect('/avisos/pendientes');

            // 2. Deep Populate eficiente usando Promise.all y .map()
            // Procesamos todos los equipos simultáneamente
            await Promise.all(equiposAtendidos.map(async (eq) => {
                
                // Procesar Contadores del equipo en paralelo
                const promesasContadores = eq.contadores.map(async (cont) => {
                    const detalle = await TipoContadores.findOne({ id: cont.tipoContador });
                    cont.nombreContador = detalle ? detalle.nombre : 'Contador';
                });

                // Procesar Artículos del equipo en paralelo
                const promesasArticulos = eq.articulos.map(async (art) => {
                    const detalle = await Articulos.findOne({ id: art.articulo });
                    art.detalleArticulo = detalle || {};
                });

                // Esperar a que terminen todas las sub-consultas de este equipo
                return Promise.all([...promesasContadores, ...promesasArticulos]);
            }));

            // 3. Cargar contactos del cliente
            //const contactos = await Contacto.find({ cliente: intervencion.cliente.id });

            // 4. Inyectar equipos procesados al objeto principal
            intervencion.equipos = equiposAtendidos;
            let contactos=await ClienteContacto.find({cliente:intervencion.cliente.id,ubicacion:intervencion.ubicacion.id,activo:1})
            let tipoContacto=await TipoContacto.find({activo:1})
            if (intervencion.oficina!=req.oficinaElegida.id && intervencion.ubicacion.oficinaAtencion!=req.oficinaElegida.id&&intervencion.atendidoPor!=req.session.usuario.id) {
                return res.view("pages/avisos/finalizar-intervencion",{intervencion,contactos,tipoContacto,permiso:0});
            }
            return res.view("pages/avisos/finalizar-intervencion",{intervencion,contactos,tipoContacto,permiso:1});
            /*return res.view('pages/avisos/finalizar-intervencion', {
                intervencion,
                contactos,
                layout: 'layouts/layout'
            });*/

        } catch (err) {
            sails.log.error(err);
            return res.serverError(err);
        }
    },
    crearContacto: async function (req, res) {
        try {
            // Validar que los datos existan
            if (!req.body.nombre || !req.body.cliente) {
                return res.badRequest({ message: 'Datos incompletos' });
            }

            let contacto = await ClienteContacto.create({
                nombre: req.body.nombre,
                tipocontacto: req.body.puesto,
                telefono:req.body.telefono,
                email: req.body.email,
                cliente: req.body.cliente,
                ubicacion: req.body.ubicacion,
                oficina:req.oficinaElegida.id
            }).fetch();

            return res.json(contacto);
        } catch (err) {
            return res.serverError(err);
        }
    },
    atencionPendiente:async function(req,res){
        const moment = require('moment-timezone');
        let intervencionId=0
        if(req.params.intervencion){
            intervencionId=req.params.intervencion
        }
        let equipoIntervencion
        let a=await AvisoEquipo.findOne({id:req.params.equipoAviso});
        let horaInicioAtencion = moment().tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss');
        //console.log("datos:",a)
        //console.log("Primero:",a.fechaInicio)
        if(a.fechaInicio==null){
            //console.log("segundo:",a.fechaInicio)
            await AvisoEquipo.updateOne({id:req.params.equipoAviso}).set({fechaInicio:horaInicioAtencion});
            //console.log("tercero:",a.fechaInicio)
            if(intervencionId==0){
                await Avisos.updateOne({id:a.aviso}).set({fechaInicio:horaInicioAtencion});
                //console.log("cuarto:",a.fechaInicio)
            }
        }
        let aviso=await Avisos.findOne({id:req.params.aviso}).populate('ubicacion').populate('cliente')
        let avisoEquipo=await AvisoEquipo.findOne({id:req.params.equipoAviso}).populate('tipoProblema');
        let equipo=await Equipos.findOne({id:avisoEquipo.equipo});
        let contInt=await IntervencionEquipo.count({equipo:equipo.id,aviso:aviso.id});
        let tipoContadores=await TipoContadores.find({activo:1,tipoAvisos:aviso.tipoAviso});
        if(intervencionId!=0){
            equipoIntervencion=await IntervencionEquipo.findOne({avisoEquipo:req.params.equipoAviso,intervencion:intervencionId}).populate('contadores').populate('articulos');
            if (equipoIntervencion) {
                // 2. Creamos un array de promesas para ejecutar todo en paralelo
                // Usamos el operador spread (...) para aplanar los arrays de promesas
                await Promise.all([
                    // Poblamos TipoAviso
                    TipoAvisos.findOne({ id:equipoIntervencion.tipoAviso }).then(res =>equipoIntervencion.tipoAviso = res),

                    // Poblamos TipoProblema
                    TipoProblemas.findOne({ id:equipoIntervencion.tipoProblema }).then(res =>equipoIntervencion.tipoProblema = res),

                    // Poblamos todos los Contadores
                    ...(equipoIntervencion.contadores || []).map(async (cont) => {
                        cont.tipoContador = await TipoContadores.findOne({ id: cont.tipoContador });
                    }),

                    // Poblamos todos los Artículos
                    ...(equipoIntervencion.articulos || []).map(async (art) => {
                        const detalleArt = await Articulos.findOne({ id: art.articulo });
                        art.detalleArticulo = detalleArt || { nombre: 'N/A', codigo: 'S/C' };
                    })
                ]);
            }
            /*await Promise.all(equipoIntervencion.map(async (eq) => {
                // Poblamos los nombres de los Contadores
                const promesasContadores = eq.contadores.map(async (cont) => {
                    const detalleTipo = await TipoContadores.findOne({ id: cont.tipoContador });
                    cont.tipoContador=detalleTipo
                });
                // Poblamos los detalles de los Artículos (Materiales)
                const promesasArticulos = eq.articulos.map(async (art) => {
                    const detalleArt = await Articulos.findOne({ id: art.articulo });
                    art.detalleArticulo = detalleArt || { nombre: 'N/A', codigo: 'S/C' };
                });
                eq.tipoAviso=await TipoAvisos.findOne({id:eq.tipoAviso});
                eq.tipoProblema=await TipoProblemas.findOne({id:eq.tipoProblema});
                // Esperamos a que todas las consultas de este equipo terminen
                return Promise.all([...promesasContadores, ...promesasArticulos]);
            }));*/
        }
        /*if(contInt>0){
            req.addFlash('mensaje', 'No se puede iniciar la atención de este aviso porque ya esta en una intervención, para cambiar valores, tienes que editar esa intervención');
            return res.redirect(`/avisos/ficha/${aviso.id}`);
        }*/
        let contactos=await ClienteContacto.find({cliente:aviso.cliente.id,ubicacion:aviso.ubicacion.id,activo:1})
        console.log("Datos del equipo: ",equipoIntervencion)
        if (aviso.oficina!=req.oficinaElegida.id && aviso.ubicacion.oficinaAtencion!=req.oficinaElegida.id&&aviso.atendidoPor!=req.session.usuario.id) {
            return res.view("pages/avisos/atender-pendiente",{aviso,contactos,equipo,avisoEquipo,tipoContadores,intervencionId,permiso:0,equipoIntervencion});
        }
        return res.view("pages/avisos/atender-pendiente",{aviso,contactos,equipo,avisoEquipo,tipoContadores,intervencionId,permiso:1,equipoIntervencion});
    },
    /*cerrarIntervencion: async function (req, res) {
        try {
            const { intervencionId, observaciones, contacto, firmaBase64 } = req.body;

            // Actualizar la intervención con los datos de cierre
            const updatedIntervencion = await Intervencion.updateOne({ id: intervencionId })
                .set({
                    observacionesFinales: observaciones,
                    contacto: contacto,
                    firma: firmaBase64, // Guardamos el Base64
                    fechaCierre: new Date(),
                    estado: 'terminado'
                });

            // Opcional: Actualizar el estado del Aviso principal
            await Aviso.updateOne({ id: updatedIntervencion.aviso })
                .set({ estado: 'atendido' });

            return res.ok();
        } catch (err) {
            return res.serverError(err);
        }
    },*/
    actualizarMaterial: async function(req, res) {
        let db = await sails.getDatastore().transaction(async (db) => {
            const { materialId, nuevaCantidad } = req.body;
            console.log("material: ",materialId)
            console.log(nuevaCantidad)
            console.log('body: ',req.body)
            // 1. Obtener registro actual del material en la intervención
            const matIntervencion = await IntervencionArticulos.findOne({ id: materialId }).usingConnection(db);
            const stockUsr = await StockUsuario.findOne({ 
                articulo: matIntervencion.articulo, 
                usuario: req.session.usuario.id,
                oficina:req.oficinaElegida.id
            }).usingConnection(db);

            const diferencia = Number(nuevaCantidad) - Number(matIntervencion.cantidad);

            // 2. Validar si hay stock suficiente para el incremento
            if (diferencia > 0 && stockUsr.cantidad < diferencia) {
                return { ok: false,msj:'No hay existencias suficientes' };
                //throw new Error('No hay existencias suficientes');
            }
            if(diferencia==0){
                 return { ok: false,msj:'La cantidad es la misma que ya se había ingresado' };
            }
            // 3. Actualizar Stock del Usuario
            await StockUsuario.updateOne({ id: stockUsr.id })
                .set({ cantidad: Number(stockUsr.cantidad) - diferencia })
                .usingConnection(db);

            // 4. Registrar Movimiento
            await MovimientoInventario.create({
                tipo: 'USO_INTERNO',
                articulo: matIntervencion.articulo,
                cantidad: Math.abs(diferencia),
                concepto: diferencia > 0 ? `Salida por ajuste en intervención: ${matIntervencion.intervencion}` : `Entrada por ajuste en intervención: ${matIntervencion.intervencion}`,
                usuarioResponsable: req.session.usuario.id,
                usuarioAsignado: req.session.usuario.id,
                costoAplicado:matIntervencion.costopromedio,
                oficina:req.oficinaElegida.id
            }).usingConnection(db);
            
            // 5. Actualizar la intervención
            await IntervencionArticulos.updateOne({ id: materialId })
                .set({ cantidad: nuevaCantidad })
                .usingConnection(db);

            return { ok: true };
        });
        return res.json(db);
    },
    eliminarMaterial: async function(req, res) {
        let db = await sails.getDatastore().transaction(async (db) => {
            const { materialId } = req.body;
            
            // 1. Obtener registro actual del material en la intervención
            const matIntervencion = await IntervencionArticulos.findOne({ id: materialId }).usingConnection(db);
            const stockUsr = await StockUsuario.findOne({ 
                articulo: matIntervencion.articulo, 
                usuario: req.session.usuario.id,
                oficina:req.oficinaElegida.id
            }).usingConnection(db);


            await StockUsuario.updateOne({ id: stockUsr.id })
                .set({ cantidad: Number(stockUsr.cantidad) +  Number(matIntervencion.cantidad)})
                .usingConnection(db);

            // 4. Registrar Movimiento
            await MovimientoInventario.create({
                tipo: 'USO_INTERNO',
                articulo: matIntervencion.articulo,
                cantidad: matIntervencion.cantidad,
                concepto: `Entrada por ajuste en intervención: ${matIntervencion.intervencion}`,
                usuarioResponsable: req.session.usuario.id,
                usuarioAsignado: req.session.usuario.id,
                costoAplicado:matIntervencion.costopromedio,
                oficina:req.oficinaElegida.id
            }).usingConnection(db);
            
            await IntervencionArticulos.destroyOne({ id: materialId }) .usingConnection(db);

            return { ok: true };
        });
        return res.json(db);
    },
    actualizarContador:async function(req,res){
        let contador=await IntervencionContadores.findOne({id:req.body.id}).populate('tipoContador');
        
        if(contador.tipoContador.tipoAvisos!=4&&contador.tipoContador.tipoAvisos!=3){
            let id=contador.id
            console.log("Entra a este apartado",contador.tipoContador.tipocontador)
            if(contador.tipoContador.tipocontador=="Entrada"){
                id=id+1;
                let cont=await IntervencionContadores.findOne({id:id})
                 console.log("Entrada")
                 console.log(req.body.valor>cont.valor,contador.valor,cont.valor)
                if(req.body.valor>cont.valor){
                    console.log("Entra mayor")
                    return res.json({ok:false,msj:'El contador de entrada no puede ser mayor al de salida'})
                }
            }
            else{
                id=id-1; 
                console.log("salida")
                let cont=await IntervencionContadores.findOne({id:id})
                if(req.body.valor<cont.valor){

                    console.log("salida menor")
                    return res.json({ok:false,msj:'El contador de salida no puede ser menor al de salida'})
                }
            }
        }
        let procesado=0;
        if(contador.tipoAviso==3){
            procesado=(Number(req.body.valor)-Number(contador.valorAnterior))-Number(contador.bonificacion)
        }
        await IntervencionContadores.updateOne({ id: req.body.id }).set({ valor: req.body.valor,procesado })
        return res.json({ok:true,procesado})
    },
    cerrarIntervencion: async function(req, res) {
        const self=this;
        let intUpdated;
        try {
            let db = await sails.getDatastore().transaction(async (db) => {
                const { id, observaciones, contacto, firmaBase64 } = req.body;
                
                // 1. Procesar la imagen Base64
                // Eliminamos el encabezado "data:image/jpeg;base64,"
                const numeroAleatorio = crypto.randomInt(1000, 9999);
                const base64Data = firmaBase64.replace(/^data:image\/jpeg;base64,/, "");
                const nombreArchivo = `firma_int_${id}_${numeroAleatorio}_${Date.now()}.jpg`;
                
                // Ruta absoluta para escribir el archivo
                const rutaDestino = path.resolve(sails.config.appPath, 'assets/images/firmas', nombreArchivo);

                // 2. Escribir el archivo físicamente en el servidor
                fs.writeFileSync(rutaDestino, base64Data, 'base64');

                // 3. Guardar solo la URL relativa en la base de datos
                const urlFirma = `/images/firmas/${nombreArchivo}`;


                // 1. Obtener datos para cálculos
                const intervencion = await Intervenciones.findOne({ id }).populate('equipos').usingConnection(db);
                const equipos = await IntervencionEquipo.find({ intervencion: id }).usingConnection(db);

                // 2. Cálculo de tiempos
                const momentosCierre = equipos.map(e => moment(e.fechaCierre));
                const ultimaFechaCierre = moment.max(momentosCierre);
                const fechaInicio = moment(intervencion.fechaInicio);
                // Calculamos la diferencia directamente en minutos
                const minutosSolucion = ultimaFechaCierre.diff(fechaInicio, 'minutes');
                // Para usarlo en la base de datos (como objeto Date o string)
                const fechaCierreFinal = ultimaFechaCierre.toDate(); 
                // 3. Actualización de Intervención
                let count=await AvisoEquipo.count({aviso:intervencion.aviso,estado:{'!=':'Operativo'}}).usingConnection(db)
                let estadoFinal=(count>0)?'pendiente':'finalizado'
                intUpdated = await Intervenciones.updateOne({ id }).set({
                    observaciones: observaciones,
                    firma: urlFirma,
                    fechaCierre: fechaCierreFinal,
                    tiemposolucion: minutosSolucion,
                    estado: estadoFinal,
                    contacto: contacto === '0' ? null : contacto,
                    atendidoPor:req.session.usuario.id
                }).usingConnection(db);
                // 4. Actualización de Aviso
                await Avisos.updateOne({ id: intervencion.aviso }).set({ 
                    estado: estadoFinal, 
                    fechaCierre: fechaCierreFinal, 
                    tiemposolucion: minutosSolucion 
                }).usingConnection(db);
                await SeguimientoAviso.create({aviso:intervencion.aviso,usuario:req.session.usuario.id,descripcion:'Aviso Cerrado'}).usingConnection(db)
                return intUpdated;
            });

            // 5. Enviar Reporte (Proceso asíncrono para no bloquear respuesta)
            setImmediate(async () => {
                try {
                    // Al ser una función asíncrona definida fuera del module.exports,
                    // la llamamos directamente por su nombre.
                    await enviarReportePDF(db.id);
                    console.log(`Reporte enviado en segundo plano para ID: ${db.id}`);
                } catch (err) {
                    console.error('Error enviando reporte en segundo plano:', err);
                }
            });

            return res.json({ ok: true,intUpdated });
        } catch (err) {
            return res.serverError(err);
        }
    },
    descargarPDF: async function(req, res) {
        try {
            const data = await obtenerDatosCompletosIntervencion(req.params.id);
            //console.log(data)
            let subtotalGeneral = 0;

            data.equipos.forEach(eq => {
                eq.articulos.forEach(art => {
                    // Cálculo de subtotal por línea
                    art.subtotalLinea = Number(art.cantidad) * Number(art.costopublico);
                    subtotalGeneral += art.subtotalLinea;
                });
            });
            const iva = subtotalGeneral * 0.16;
            const totalFinal = subtotalGeneral + iva;
            const formatter = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
            });
            //const money = (valor) => formatter.format(valor || 0);
            const money = (valor) => {
                return new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 2
                }).format(Number(valor || 0).toFixed(2)); // Redondeo a 2 decimales
            };

            // Función auxiliar para convertir minutos a HH:mm
            const formatTime = (totalMinutes) => {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            };

            let firmaBase64 = null;

            if (data.firma) {
                const rutaFirma = path.resolve(sails.config.appPath, 'assets', data.firma.replace(/^\//, ''));
                if (fs.existsSync(rutaFirma)) {
                    const imagen = fs.readFileSync(rutaFirma);
                    firmaBase64 = `data:image/jpeg;base64,${imagen.toString('base64')}`;
                }
            }

            // 1. Encontrar al coordinador de la oficina
            // Buscamos un usuario que pertenezca a la oficina y tenga la bandera coordinador: true
            let idsOficinas = [data.oficina.id];
            if (data.ubicacion && data.ubicacion.oficinaAsignada) {
                idsOficinas.push(data.ubicacion.oficinaAsignada);
            }
            const coordinadores = await User.find({
                oficinas: idsOficinas,
                coordinador: true
            });


            // 2. Generar el PDF
            const html = await sails.renderView('templates/pdf-reporte', { 
                intervencion: data, 
                layout: false, 
                moment: moment,
                tRespuesta:formatTime(data.tiemporespuesta),
                tSolucion:formatTime(data.tiemposolucion),
                firma:firmaBase64,
                iva:iva,
                totalFinal:totalFinal,
                subtotalGeneral:subtotalGeneral,
                money:money,

            });

            // 4. Generar el Buffer del PDF usando tu helper de Puppeteer
            const pdfBuffer = await sails.helpers.generarPdf(html);

            // 5. Configurar Headers para descarga
            res.status(200);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length); // Es vital decir el tamaño exacto
            res.setHeader('Content-Disposition', `attachment; filename="Reporte_Servicio_${data.aviso.folio}.pdf"`);

            
            return res.end(pdfBuffer,'binary');

        } catch (err) {
            sails.log.error(err);
            return res.serverError("No se pudo generar el archivo");
        }
    },
    editarDatosPlantilla:async function(req,res){
        try {
            const { equipoId, campos } = req.allParams();

            // 1. Buscamos el registro específico del equipo
            const registroEquipo = await IntervencionEquipo.findOne({ id: equipoId });

            if (!registroEquipo) return res.notFound('Equipo no encontrado');

            // 2. Opcional: Validar si la intervención general sigue pendiente
            // Si tienes el ID de la intervención padre en el modelo:
            // const padre = await Intervencion.findOne({ id: registroEquipo.intervencion });
            // if (padre.estado !== 'pendiente') return res.badRequest('Cerrado');

            // 3. Reconstruir el JSON de la plantilla
            let plantillaActualizada = registroEquipo.plantilla;
            plantillaActualizada.campos = campos;
            plantillaActualizada.fechaRegistro = new Date().toISOString();

            // 4. Actualizar solo ese equipo
            await IntervencionEquipo.updateOne({ id: equipoId })
                .set({ plantilla: plantillaActualizada });

            return res.ok({ message: 'Equipo actualizado correctamente' });

        } catch (err) {
            return res.serverError(err);
        }
    },
    //Editar intervención
    editarFormIntervencion: async function (req, res) {
        try {
            const idIntervencion = req.param('id');

            await Intervenciones.updateOne({id:idIntervencion}).set({estado:'pendiente'});
            // 1. Carga inicial: Intervención y Equipos (en paralelo)
            const [intervencion, equiposAtendidos] = await Promise.all([
                Intervenciones.findOne({ id: idIntervencion }).populate('cliente').populate('ubicacion').populate('aviso').populate('contacto'),
                IntervencionEquipo.find({ intervencion: idIntervencion }).populate('equipo').populate('contadores').populate('articulos')
            ]);

            if (!intervencion) return res.redirect('/avisos/pendientes');

            // 2. Deep Populate eficiente usando Promise.all y .map()
            // Procesamos todos los equipos simultáneamente
            await Promise.all(equiposAtendidos.map(async (eq) => {
                
                // Procesar Contadores del equipo en paralelo
                const promesasContadores = eq.contadores.map(async (cont) => {
                    const detalle = await TipoContadores.findOne({ id: cont.tipoContador });
                    cont.nombreContador = detalle ? detalle.nombre : 'Contador';
                });

                // Procesar Artículos del equipo en paralelo
                const promesasArticulos = eq.articulos.map(async (art) => {
                    const detalle = await Articulos.findOne({ id: art.articulo });
                    art.detalleArticulo = detalle || {};
                });

                // Esperar a que terminen todas las sub-consultas de este equipo
                return Promise.all([...promesasContadores, ...promesasArticulos]);
            }));

            // 3. Cargar contactos del cliente
            //const contactos = await Contacto.find({ cliente: intervencion.cliente.id });

            // 4. Inyectar equipos procesados al objeto principal
            intervencion.equipos = equiposAtendidos;
            if(intervencion.contacto){
                intervencion.contacto.puesto=await TipoContacto.findOne({id:intervencion.contacto.tipocontacto})
            }
            let contactos=await ClienteContacto.find({cliente:intervencion.cliente.id,ubicacion:intervencion.ubicacion.id,activo:1})
            let tipoContacto=await TipoContacto.find({activo:1})

            console.log("Equipos:",intervencion.equipos)
            if (intervencion.oficina!=req.oficinaElegida.id && intervencion.ubicacion.oficinaAtencion!=req.oficinaElegida.id&&intervencion.atendidoPor!=req.session.usuario.id) {
                return res.view("pages/avisos/finalizar-intervencion",{intervencion,contactos,tipoContacto,permiso:0});
            }
            return res.view("pages/avisos/editar-intervencion",{intervencion,contactos,tipoContacto,permiso:1});
            /*return res.view('pages/avisos/finalizar-intervencion', {
                intervencion,
                contactos,
                layout: 'layouts/layout'
            });*/

        } catch (err) {
            sails.log.error(err);
            return res.serverError(err);
        }
    },
    agregarMateriales:async function(req,res){
        let intervencionArticulo;
        await sails.getDatastore().transaction(async (db) => {
            let material=await StockUsuario.findOne({articulo:req.body.id,oficina:req.oficinaElegida.id,usuario:req.session.usuario.id}).populate('articulo').usingConnection(db);
            let intervencion=await Intervenciones.findOne({id:req.body.intervencion});
            if(material.cantidad<1){
                return res.json({ok:false,intervencionArticulo});
            }
                    await StockUsuario.updateOne({ id: material.id }).set({ cantidad: Number(material.cantidad) - Number(1) }).usingConnection(db);
                    let aviso=await Avisos.findOne({id:intervencion.aviso});
                    let avisoEquipo=await AvisoEquipo.findOne({aviso:aviso.id,equipo:req.body.idequipo})
                    let intervencionEquipo=await IntervencionEquipo.findOne({intervencion:intervencion.id,equipo:req.body.idequipo});
                    //let contadores=await IntervencionContadores.find({intervencion:intervencion.id,equipo:req.body.idequipo});
                    let contador=0
                    if(aviso.tipoAviso==4){
                            console.log("Entra a tipo aviso")
                            let tcon=await TipoContadores.findOne({tipoAvisos:aviso.tipoAviso,nombre:material.articulo.tipocolor,activo:1});
                            console.log("tcon:",tcon)
                            console.log("aviso: ",aviso)
                            console.log("equipo: ",req.body.idequipo)
                            let contadorEncontrado = await IntervencionContadores.findOne({aviso:aviso.id,tipoContador:tcon.id,equipo:req.body.idequipo}).usingConnection(db);
                            console.log("Contadores: ",contadorEncontrado)
                            contador=contadorEncontrado.valor
                            console.log("Contador:",contadorEncontrado.valor)
                        }
                 
                   intervencionArticulo= await IntervencionArticulos.create({
                        cantidad:1,
                        costopromedio:req.body.costopromedio,
                        costopublico:req.body.preciopublico,
                        articulo:material.articulo.id,
                        equipo:req.body.idequipo,
                        intervencion:req.body.intervencion,
                        avisoEquipo:avisoEquipo.id,
                        atendidoPor:req.session.usuario.id,
                        aviso:aviso.id,
                        tipoAviso:aviso.tipoAviso,
                        oficina:aviso.oficina.id,
                        cliente:aviso.cliente,
                        ubicacion:aviso.ubicacion,
                        contador:contador,
                        intervencionEquipo:intervencionEquipo.id}).fetch().usingConnection(db)
                    await MovimientoInventario.create({
                            tipo: 'USO_INTERNO',
                            cantidad: 1,
                            articulo: material.articulo.id,
                            oficina: req.oficinaElegida.id,
                            usuarioResponsable: req.session.usuario.id,
                            usuarioAsignado: req.session.usuario.id,
                            costoAplicado:req.body.costopromedio,
                            concepto: `Salida por Uso en intervención #${intervencion.id}`
                        }).usingConnection(db);
                
        })
        console.log(intervencionArticulo)
        //return { ok: true,intervencionArticulo };
        return res.json({ok:true,intervencionArticulo});
    },
    editarIntervencion: async function(req, res) {
        let inter=await Intervenciones.findOne({id:req.body.intervencionId});
        const self=this;
        try {
            let db = await sails.getDatastore().transaction(async (db) => {
                const { intervencionId, observaciones } = req.body;
                

                const intUpdated = await Intervenciones.updateOne({ id:intervencionId }).set({
                    observaciones: observaciones,
                    estado: 'finalizado',
                }).usingConnection(db);
                // 4. Actualización de Aviso
                await Avisos.updateOne({ id: intUpdated.aviso }).set({ 
                    estado: 'finalizado', 
                }).usingConnection(db);
                await SeguimientoAviso.create({aviso:intUpdated.aviso,usuario:req.session.usuario.id,descripcion:'Aviso Cerrado'}).usingConnection(db)
                return intUpdated;
            });

            return res.json({ ok: true,inter });
        } catch (err) {
            return res.serverError(err);
        }
    },
    //Avisos remotos tomas de lecturas
    remotos:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ahora = new Date().getTime(); // Timestamp actual
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        const avisos = await Avisos.find({ where: {activo:1,estado:'pendiente',tipoAviso:3,or: [{ oficina: oficinaId },{ ubicacion: idsUbicacionesForaneas } ]}}).populate('cliente').populate('ubicacion').populate('oficina').populate('atendidoPor').populate('tipoAviso').populate('prioridad').populate('equiposInvolucrados')
        await Promise.all(
            avisos.map(async (aviso)=>{
                // LLAMADA A TU FUNCIÓN DE HORARIOS
                // Pasamos fecha inicio, fecha fin (ahora) y la oficina para los horarios
                let fechaInicio=moment(aviso.createdAt).tz("America/Mexico_City");
                let fechaCierre=moment(ahora).tz("America/Mexico_City")
                console.log("Fecha cierre aviso: ",aviso.fechaCierre)
                if(aviso.fechaCierre){
                    console.log("Entra a aviso fecha cierre")
                    fechaCierre=moment(aviso.fechaCierre).tz("America/Mexico_City")
                }
                
                const tecnico = await User.findOne({id: aviso.atendidoPor.id});
                const minutosHabiles = await calcularMinutosSincomida(
                    fechaInicio, 
                    fechaCierre, 
                    aviso.oficina,
                    tecnico.horacomida
                );

                // Determinamos el TR objetivo (Poliza o Estimado)
                let trObjetivo=0;
                if(aviso.oficina.id===oficinaId){
                    trObjetivo=aviso.trEstimado
                }else{
                    if(aviso.ubicacion.oficinaAtencion==oficinaId){
                        trObjetivo=aviso.trPoliza
                    }
                }
                //const trObjetivo = (aviso.trPoliza && aviso.trPoliza > 0) ? aviso.trPoliza : aviso.trEstimado;

                // Guardamos los cálculos en el objeto aviso
                aviso.minutosTranscurridos = minutosHabiles;
                aviso.trObjetivo = trObjetivo;
                aviso.fueraDeTiempo = minutosHabiles > trObjetivo;
                aviso.equiposInvolucrados=await Promise.all(
                    aviso.equiposInvolucrados.map(async (eo) => {
                        let equipos=await AvisoEquipo.findOne({id:eo.id}).populate('tipoProblema').populate('equipo')
                        
                        let datos={
                            tipoProblema:equipos.tipoProblema.nombre,
                            serie:equipos.equipo.numeroserie,
                            marca:equipos.equipo.marca,
                            modelo:equipos.equipo.modelo,
                            descripcion:equipos.equipo.descripcion
                        }
                        eo.equipo = datos;
                        return eo;
                    })
                )
            })
        );
        return res.view("pages/avisos/remotos",{avisos});
    },
    remotosIniciarAtencion:async function(req,res){
        try{
            const idsString = req.param('ids');
            if (!idsString) return res.redirect('/avisos/remotos');

            const idsArray = idsString.split(',');

            // 1. Obtenemos los tipos de contadores oficiales para el Tipo de Aviso 3
            // Esto nos sirve de base para inicializar en 0 si no hay historial
            const catalogoTipos3 = await TipoContadores.find({ tipoAvisos: 3,activo:1 });

            // 2. Buscamos los avisos seleccionados
            const avisos = await Avisos.find({ id: idsArray }).populate('cliente').populate('equiposInvolucrados').populate('ubicacion');

            // 3. Procesamos cada aviso y equipo
            for (let aviso of avisos) {
                for (let eqInvolucrado of aviso.equiposInvolucrados) {
                    
                    const equipoId = eqInvolucrado.equipo; 

                    // --- LÓGICA 1: DETERMINAR FECHA LÍMITE Y CONTADORES ANTERIORES ---
                    // Buscamos la última intervención de lectura (Tipo 3) para este equipo
                    const ultimaIntervencionR3 = await IntervencionContadores.find({equipo: equipoId,tipoAviso: 3}).sort('createdAt DESC');

                    let fechaLimite;
                    let int=0;
                    let lecturasPrevias = [];
                    //console.log("ultima",ultimaIntervencionR3.length)
                    if (ultimaIntervencionR3.length>0) {
                        // Si existe, la fecha límite es ese registro
                        fechaLimite = new Date(ultimaIntervencionR3[0].createdAt);
                        int = ultimaIntervencionR3[0].intervencion;
                        //console.log("Fecha limite",fechaLimite)
                        // Buscamos todos los contadores de esa misma fecha/intervención para ese equipo
                        lecturasPrevias = await IntervencionContadores.find({
                            equipo: equipoId,
                            tipoAviso: 3,
                            intervencion:int
                        }).populate('tipoContador');
                    } else {
                        // Si NO existe, fecha de respaldo: 35 días atrás
                        fechaLimite = new Date();
                        fechaLimite.setDate(fechaLimite.getDate() - 35);

                        // Inicializamos lecturas en 0 basándonos en el catálogo del sistema
                        lecturasPrevias = catalogoTipos3.map(tipo => ({
                            tipoContador: tipo,
                            valor: 0,
                            nombreManual: tipo.nombre // Auxiliar para la vista
                        }));
                    }

                    eqInvolucrado.lecturaAnteriorJSON = lecturasPrevias;

                    // --- LÓGICA 2: CÁLCULO DE BONIFICACIONES (Tipo Aviso 1 y 2) ---
                    const intervencionesBonificables = await IntervencionContadores.find({equipo: equipoId,tipoAviso: [1, 2],createdAt: { '>':fechaLimite } }).populate('tipoContador');

                    let bonificaciones = { 'Monocromo': 0, 'Color': 0, 'Escaner': 0 };

                    intervencionesBonificables.forEach(inter => {
                        if (inter.tipoContador && inter.tipoContador.nombre) {
                            let nombreNorm = '';
                            const nombreDB = inter.tipoContador.nombre.toUpperCase();
                            // Obtenemos si es Entrada o Salida desde el campo correspondiente en tipoContador
                            const funcionContador = inter.tipoContador.tipocontador.toUpperCase(); // "ENTRADA" o "SALIDA"

                            // 1. Clasificar el nombre del contador
                            if (nombreDB.includes('COLOR')) nombreNorm = 'Color';
                            else if (nombreDB.includes('MONOCROMO')) nombreNorm = 'Monocromo';
                            else if (nombreDB.includes('ESCANER')) nombreNorm = 'Escaner';

                            if (nombreNorm) {
                                // 2. Aplicar la lógica de bonificación: (Salida - Entrada)
                                // Si el registro es de tipo SALIDA, sumamos su valor
                                // Si el registro es de tipo ENTRADA, restamos su valor
                                const valorActual = Number(inter.valor) || 0;

                                if (funcionContador.includes('SALIDA')) {
                                    bonificaciones[nombreNorm] += valorActual;
                                } else if (funcionContador.includes('ENTRADA')) {
                                    bonificaciones[nombreNorm] -= valorActual;
                                }
                            }
                        }
                    });

                    eqInvolucrado.bonificacionesCalculadas = bonificaciones;
                    eqInvolucrado.fechaReferenciaBonif = fechaLimite; 
                    eqInvolucrado.equipo=await Equipos.findOne({id:eqInvolucrado.equipo});
                    
                }
                await Avisos.updateOne({id:aviso.id}).set({fechaInicio:moment().tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss')})
                await AvisoEquipo.update({aviso:aviso.id}).set({fechaInicio:moment().tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss')})
            }
            console.log("equipos",avisos[0].equiposInvolucrados[0].lecturaAnteriorJSON)
            return res.view('pages/avisos/captura-masiva', {
            avisos: avisos
            });

        } catch (err) {
            console.error("Error en remotosIniciarAtencion:", err);
            return res.serverError(err);
        }
    },
    remotosGuardar:async function(req,res){
        //console.log(req.body.lecturas)
        let datos=req.body.lecturas;
        const tecnico = await User.findOne({id: req.session.usuario.id});
        let avisoId=0;
        let intervencion
        let equipoInt
        let equiIn=0;
        let db = await sails.getDatastore().transaction(async (db) => {
            for (let d of datos) {
                let info;
                let aviso=await Avisos.findOne({id:d.aviso}).populate('oficina').usingConnection(db);
                let equipo=await AvisoEquipo.findOne({id:d.equipoInvolucrado}).usingConnection(db);
                let fechaInicioTR=aviso.createdAt;
                let fechaFinTR=aviso.fechaInicio;
                let fechaCierre=moment(aviso.fechaInicio).tz("America/Mexico_City")
                let fechaCreacion=moment(aviso.createdAt).tz("America/Mexico_City");
                let fechaFinTS=moment().tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss')
                let fechaFin=moment(fechaFinTS).tz("America/Mexico_City");
                let minutosTotales=await calcularMinutosSincomida(fechaCreacion,fechaCierre,aviso.oficina,tecnico.horacomida)
                const minutosSolucion = fechaFin.diff(fechaCierre, 'minutes');
                if(equipo.equipo!=equiIn){
                    if(avisoId!=aviso.id){
                        datosIntervencion={
                            notas:'',
                            fechaInicio:aviso.fechaInicio,
                            fechaCierre:fechaFinTS,
                            firma:'',
                            atendidoPor:tecnico.id,
                            observaciones:'Cerrado de forma masiva',
                            tiemporespuesta:minutosTotales,
                            tiemposolucion:minutosSolucion,
                            trEstimado:aviso.trEstimado,
                            trPoliza:aviso.trPoliza,
                            estado:'finalizado',
                            aviso:aviso.id,
                            tipoAviso:aviso.tipoAviso,
                            oficina:aviso.oficina.id,
                            cliente:aviso.cliente,
                            ubicacion:aviso.ubicacion,
                            contacto:aviso.contacto?aviso.contacto:null
                        }
                        intervencion=await Intervenciones.create(datosIntervencion).fetch().usingConnection(db)
                        
                        //console.log("datosIntervencion: ",datosIntervencion)
                        //console.log("--------------------------------------------------")
                        
                        avisoId=aviso.id
                        //Realizar actualizaciones a los avisos y a avisoEquipo
                        await Avisos.updateOne({id:aviso.id}).set({tiemporespuesta:minutosTotales,tiemposolucion:minutosSolucion,fechaCierre:fechaFinTS,estado:'finalizado',atendidoPor:tecnico.id});
                        
                        await SeguimientoAviso.create({aviso:aviso.id,usuario:tecnico.id,descripcion:'Aviso Cerrado'}).usingConnection(db)
                    }
                    datosEquipos={
                            notas:'',
                            fechaInicio:aviso.fechaInicio,
                            fechaCierre:fechaFinTS,
                            tiemporespuesta:minutosTotales,
                            tiemposolucion:minutosSolucion,
                            trEstimado:aviso.trEstimado,
                            trPoliza:aviso.trPoliza,
                            observaciones:'Equipo atendido',
                            atendidoPor:tecnico.id,
                            aviso: aviso.id,
                            equipo: equipo.equipo,
                            tipoAviso: aviso.tipoAviso,
                            avisoEquipo: equipo.id,
                            tipoProblema: equipo.tipoProblema, // El problema específico de ESTE equipo en ESTE aviso
                            oficina:aviso.oficina.id,
                            cliente:aviso.cliente,
                            ubicacion:aviso.ubicacion,
                            contacto:aviso.contacto?aviso.contacto:null,
                            intervencion:intervencion.id//intervencion.id
                        }
                    equipoInt=await IntervencionEquipo.create(datosEquipos).fetch().usingConnection(db)
                    //console.log("datosEquipos",datosEquipos)
                    //console.log("--------------------------------------------------")
                    await AvisoEquipo.updateOne({id:equipo.id}).set({fechaCierre:fechaFinTS,tiemporespuesta:minutosTotales,tiemposolucion:minutosSolucion,estado:'Operativo',estadoEquipo:'atendido',atendidoPor:tecnico.id})
                    equiIn=equipo.equipo;
                }
                datosContadores={
                    valor:d.lecturaActual,
                    valorAnterior:d.lecturaAnterior,
                    bonificacion:d.bonificacion,
                    procesado:d.procesado,
                    tipoContador: d.tipoContador, 
                        atendidoPor:tecnico.id,
                        aviso: aviso.id,
                        equipo: equipo.equipo,
                        tipoAviso: aviso.tipoAviso,
                        avisoEquipo: equipo.id,
                        oficina:aviso.oficina.id,
                        cliente:aviso.cliente,
                        ubicacion:aviso.ubicacion,
                        contacto:aviso.contacto?aviso.contacto:null,
                        intervencion:intervencion.id,//intervencion.id
                        intervencionEquipo:equipoInt.id//intervencionEquipo.id
                }
                await IntervencionContadores.create(datosContadores).usingConnection(db)
                //console.log("datosContadores:",datosContadores)
                //console.log("--------------------------------------------------")
            }
        })
        return res.json({ ok: true});
    }
}