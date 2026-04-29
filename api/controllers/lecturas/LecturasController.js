
module.exports={
    lecturas:async function(req,res){
        const oficinaId = req.oficinaElegida.id;
        const ubicacionesAtendidas = await ClienteUbicacion.find({
            oficinaAtencion: oficinaId,activo:1
        });
        const idsUbicacionesForaneas = ubicacionesAtendidas.map(u=>u.id);
        const lecturas = await Lecturas.find({ where: {activo:1,or: [{ oficina: oficinaId },{ ubicacion: idsUbicacionesForaneas } ]}}).populate('cliente').populate('ubicacion').populate('oficina')
        //console.log("lecturas",lecturas);
        const resultadoFinal = lecturas.filter(e => {
            const clienteActivo = e.cliente && e.cliente.activo === 1;
            const ubicacionActiva = e.ubicacion && e.ubicacion.activo === 1;
            return clienteActivo && ubicacionActiva;
        });

        //lecturas= await Lecturas.find({activo:1,oficina:req.oficinaElegida.id}).populate('cliente').populate('ubicacion').populate('oficina')
        console.log("lecturas",resultadoFinal)
        return res.view("pages/lecturas/lecturas",{lecturas:resultadoFinal});
    },
    avisos: async function(req, res) {
        const moment = require('moment');
        const oficinaId = req.oficinaElegida.id;
        const hoyInicio = moment().startOf('day').toDate();
        const hoyFin = moment().endOf('day').toDate();
        try {
            // 1. Obtener IDs de ubicaciones foráneas (Consulta rápida)
            const ubicacionesAtendidas = await ClienteUbicacion.find({
                where: { oficinaAtencion: oficinaId, activo: 1 },
                select: ['id']
            });
            const idsUbicacionesForaneas = ubicacionesAtendidas.map(u => u.id);

            const lecturasFiltro = await Lecturas.find({
                where: {
                    activo: 1,
                    or: [
                        { oficina: oficinaId },
                        { ubicacion: idsUbicacionesForaneas }
                    ]
                }
            }).populate('cliente').populate('ubicacion').populate('equiposAsignados').populate('oficina');

            const idsLecturasValidas = lecturasFiltro
                .filter(l => l.cliente && l.cliente.activo === 1 && l.ubicacion && l.ubicacion.activo === 1)
                .map(l => l.id);

            const asistenciasHoy = await AsistenciasLecturas.find({
                where: {
                    lecturas: idsLecturasValidas, 
                    estado: 'pendiente',
                    activo:1,
                    fechaprevista: {
                        '>=': hoyInicio,
                        '<=': hoyFin
                    }
                }
            }).populate('lecturas');

            const resultado = asistenciasHoy.map(asist => {
                const lOriginal = lecturasFiltro.find(l => l.id === asist.lecturas.id);
                return {
                    id: asist.id,
                    fecha: asist.fechaprevista,
                    cliente: lOriginal.cliente,
                    ubicacion: lOriginal.ubicacion,
                    lectura: asist.lecturas,
                    equipos:lOriginal.equiposAsignados,
                    oficina:lOriginal.oficina
                };
            });
            console.log(resultado)
            return res.view("pages/lecturas/avisos",{lecturas:resultado,fechaInicio:'',fechaFin:''});

        } catch (err) {
            console.error("Error en procesamiento masivo:", err);
            return res.status(500).json({ error: "Error de servidor al intentar entrar a la generación de avisos de toma de lecturas" });
        }
    },
    filtroAvisos: async function(req, res) {
        const moment = require('moment');
        const oficinaId = req.oficinaElegida.id;
        const hoyInicio = moment(req.body.fechaInicio).startOf('day').toDate();
        const hoyFin = moment(req.body.fechaFin).endOf('day').toDate();
        try {
            // 1. Obtener IDs de ubicaciones foráneas (Consulta rápida)
            const ubicacionesAtendidas = await ClienteUbicacion.find({
                where: { oficinaAtencion: oficinaId, activo: 1 },
                select: ['id']
            });
            const idsUbicacionesForaneas = ubicacionesAtendidas.map(u => u.id);

            const lecturasFiltro = await Lecturas.find({
                where: {
                    activo: 1,
                    or: [
                        { oficina: oficinaId },
                        { ubicacion: idsUbicacionesForaneas }
                    ]
                }
            }).populate('cliente').populate('ubicacion').populate('equiposAsignados').populate('oficina');

            const idsLecturasValidas = lecturasFiltro
                .filter(l => l.cliente && l.cliente.activo === 1 && l.ubicacion && l.ubicacion.activo === 1)
                .map(l => l.id);

            const asistenciasHoy = await AsistenciasLecturas.find({
                where: {
                    lecturas: idsLecturasValidas, 
                    estado: 'pendiente',
                    activo:1,
                    fechaprevista: {
                        '>=': hoyInicio,
                        '<=': hoyFin
                    }
                }
            }).populate('lecturas');

            const resultado = asistenciasHoy.map(asist => {
                const lOriginal = lecturasFiltro.find(l => l.id === asist.lecturas.id);
                return {
                    id: asist.id,
                    fecha: asist.fechaprevista,
                    cliente: lOriginal.cliente,
                    ubicacion: lOriginal.ubicacion,
                    lectura: asist.lecturas,
                    equipos:lOriginal.equiposAsignados,
                    oficina:lOriginal.oficina
                };
            });
            //console.log("resultado",resultado)
            return res.view("pages/lecturas/avisos",{lecturas:resultado,fechaInicio:req.body.fechaInicio,fechaFin:req.body.fechaFin});

        } catch (err) {
            console.error("Error en procesamiento masivo:", err);
            return res.status(500).json({ error: "Error de servidor al procesar volumen masivo" });
        }
    },
    ficha:async function(req,res){
        let lectura=await Lecturas.findOne({id:req.params.id}).populate('ubicacion').populate('cliente').populate('oficina').populate('equiposAsignados').populate('asistencias',{where:{activo:1}})

        lectura.equiposAsignados = await Promise.all(
            lectura.equiposAsignados.map(async (eo) => {
                eo.equipo = await Equipos.findOne({ id: eo.equipo });
                return eo;
            })
        );
        lectura.asistencias = await Promise.all(
            lectura.asistencias.map(async (ast) => {
                ast.avisos = await Avisos.find({ asistencia: ast.id });
                return ast;
            })
        );
       
        //let ubicaciones=await ClienteUbicacion.find({cliente:equipos.cliente.id,activo:1})
        //let plantillas=await Plantillas.find({activo:1});
        console.log(lectura.asistencias[0].avisos)
        console.log("datos de la lectura",lectura)
        return res.view('pages/lecturas/ficha', { lectura});
    },
    crear:async function(req,res){
        let datos=req.body
        let equipos=req.body.equipos
        delete datos.equipos
        datos.periodicidad='Mensual'
        datos.cantasistencias=1
        console.log("Datos: ",datos)
        
        
        let lectura=await Lecturas.create(datos).fetch()
        if(lectura){
            for (let item of equipos) {
                await EquipoLecturas.create({equipo:item.id,oficina:datos.oficina,lecturas:lectura.id})
            }
        }
        res.status(200).send({ lectura,resp:1 });
    },
    eliminarEquipo:async function(req,res){
        let equipo = await Equipos.findOne({ id: req.query.id });
        let eliminado = await EquipoLecturas.destroyOne({ id: req.query.id });

        if (eliminado) {
            return res.ok({ message: `El equipo ${equipo.numeroserie} se ha quitado correctamente de la lectura` });
        } else {
            return res.notFound({ message: 'No se encontró el equipo para eliminar' });
        }
    },
    buscarEquipos:async function(req,res){
        let equipos=await Equipos.find({activo:1,cliente:req.query.cliente,ubicacion:req.query.ubicacion,oficina:req.query.oficina})
        
        if(equipos){
            res.status(200).send({ equipos,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ninguna ubicación" });
        }
    },
    obtenerEquipos:async function(req,res){
        let lectura=await Lecturas.findOne({id:req.query.id});
        let equiposOcupados = await EquipoLecturas.find({ 
            lecturas: lectura.id 
        }).select(['equipo']);
        let idsOcupados = equiposOcupados.map(relacion => relacion.equipo);
        let equipos=await Equipos.find({activo:1,cliente:lectura.cliente,ubicacion:lectura.ubicacion,oficina:lectura.oficina,id: { '!=': idsOcupados }})
        if (equipos.length > 0) {
            return res.status(200).send({ 
                equipos: equipos, 
                resp: 1 
            });
        } else {
            return res.status(200).send({ 
                equipos: [], 
                resp: 0, 
                message: "Todos los equipos de esta ubicación ya están en la toma de lectura." 
            });
        }
    },
    agregarEquipos:async function(req,res){
        let equipos=req.body.equipos
        let lectura=await Lecturas.findOne({id:req.body.lecturas});
        if(lectura){
            for (let item of equipos) {
                await EquipoLecturas.create({equipo:item.id,oficina:lectura.oficina,lecturas:lectura.id})
            }
        }
        res.status(200).send({ lectura,resp:1 });
    },
    actualizarLectura:async function(req,res){
        await Lecturas.updateOne({id:req.body.id}).set({
            nombre:req.body.nombre,
            inicio:req.body.inicio,
            agruparequipos:req.body.agrupar,
            observaciones:req.body.observaciones,
            fin:req.body.fin
        })
        res.status(200).send();
    },
    generarAsistencias: async function(req, res) {
        try {
            const idLectura = req.body.id;
            const moment = require('moment'); 

            let lectura = await Lecturas.findOne({ id: idLectura });
            if (!lectura) return res.status(404).send({ error: "Lectura no encontrada" });

            await AsistenciasLecturas.destroy({ lecturas: idLectura });

            let fechaInicio = moment(lectura.inicio);
            let fechaFin = moment(lectura.fin);
            let asistenciasParaCrear = [];

            let fechaActual = moment(fechaInicio);
            while (fechaActual.isSameOrBefore(fechaFin)) {
                let fechaAsistencia = moment(fechaActual);
                if (fechaAsistencia.day() === 0) {
                    fechaAsistencia.add(1, 'days');
                }

                if (fechaAsistencia.isSameOrBefore(fechaFin)) {
                    asistenciasParaCrear.push({
                        lecturas: idLectura,
                        fechaprevista: fechaAsistencia.toDate(), 
                        estado: 'pendiente',
                        oficina: lectura.oficina,
                        descripcion:req.body.descripcion
                    });
                }

                fechaActual.add(1, 'month');
            }
            if (asistenciasParaCrear.length > 0) {
                await AsistenciasLecturas.createEach(asistenciasParaCrear);
            }
            return res.status(200).send({ 
                resp: 1, 
                cantidad: asistenciasParaCrear.length,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).send({ error: "Error al generar las asistencias" });
        }
    },
    eliminarAsistencia:async function(req,res){
        let asistencia = await AsistenciasLecturas.findOne({ id: req.query.id });
        await AsistenciasLecturas.updateOne({ id: req.query.id }).set({activo:0});

        return res.ok({ message: `La asistencia ${asistencia.id} se ha eliminado de forma correcta` });
       
    },
    generarAvisos:async function(req,res){

      const moment = require('moment-timezone');
        //console.log('Datos: ',req.body)
        const ids = req.body.datos.map(item => parseInt(item.id));
        let notificaciones = [];
        let avisosCreadosTotales = 0;
        try {
            await sails.getDatastore().transaction(async (db) => {
                // 1. Buscamos asistencias. Importante: populate('lectura') 
                // y dentro de lectura, necesitamos sus equipos.
                const asistencias = await AsistenciasLecturas.find({ 
                    id: ids,
                    estado: 'pendiente',
                    activo:1
                }) .populate('lecturas') .usingConnection(db);
                if (asistencias.length === 0) {
                    throw new Error('No hay asistencias pendientes para procesar.');
                }
                for (const asistencia of asistencias) {
                    const idOficinaAsistencia = asistencia.oficina;  
                    // 2. Obtenemos los equipos directamente de la LECTURA relacionada
                    // Asumiendo que la relación en el modelo Lectura se llama 'equiposAsignados'
                    const lecturaCompleta = await Lecturas.findOne({ id: asistencia.lecturas.id }).populate('equiposAsignados').populate('cliente').usingConnection(db);
                    const equipos = lecturaCompleta.equiposAsignados || [];
                    if (equipos.length === 0) {
                        sails.log.warn(`La asistencia ${asistencia.id} no tiene equipos en su lectura.`);
                        continue; 
                    }
                   
                    // 3. Calculamos folio por oficina
                    const ultimoAvisoOficina = await Avisos.find({ oficina: idOficinaAsistencia }).sort('folio DESC').limit(1).usingConnection(db);
                    let siguienteFolio = parseInt(ultimoAvisoOficina[0]?.folio || 0) + 1;
                    const debeAgrupar = asistencia.lecturas.agruparequipos;
                    // Función para crear aviso
                    const crearAvisoConEquipos = async (listaDeEquipos) => {
                        let ub=await ClienteUbicacion.findOne({id:asistencia.lecturas.ubicacion}).populate('ruta');
                        const coords = await User.find({
                            where:{
                                or: [
                                    { oficinas: idOficinaAsistencia, coordinador: true },
                                    { oficinas: ub.oficinaAtencion ? ub.oficinaAtencion.id : null, coordinador: true }
                                ],
                                activo:1
                            }
                        }).usingConnection(db);
                        const nuevoAviso = await Avisos.create({
                            folio: siguienteFolio++,
                            tipoAviso: 3,
                            asistencia: asistencia.id,
                            oficina: idOficinaAsistencia,
                            cliente:asistencia.lecturas.cliente,
                            ubicacion:asistencia.lecturas.ubicacion,
                            fechaAtencion:asistencia.fechaprevista,
                            creadoPor:req.session.usuario.id,
                            atendidoPor:ub.ruta.usuario,
                            prioridad:3
                        }).fetch().usingConnection(db);
                        const tecnico = await User.findOne({id: ub.ruta.usuario}).usingConnection(db);
                        const listaEmailsCoordinadores = coords.map(c => c.email).filter(email => email);
                        const idsEquipos = listaDeEquipos.map(item => item.equipo);
                        const equiposDetallados = await Equipos.find({ id: idsEquipos }).usingConnection(db);
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
                        
                        notificaciones.push({
                            folio: nuevoAviso.folio,
                            cliente: lecturaCompleta.cliente.razonsocial,
                            ubicacionNombre: ub.nombre,
                            fechaAtencion: asistencia.fechaprevista,
                            equiposHTML: tablaEquiposHTML,
                            emailCliente: lecturaCompleta.cliente.email || null,
                            emailIngeniero: tecnico?.email || null,
                            nombreIngeniero: tecnico ? `${tecnico.nombre}` : 'No asignado',
                            emailsCoordinadores: listaEmailsCoordinadores 
                        });
                        for (const eq of listaDeEquipos) {
                            await AvisoEquipo.create({
                                aviso: nuevoAviso.id,
                                equipo: eq.equipo,
                                oficina: idOficinaAsistencia,
                                tipoProblema: 9,
                                observaciones:asistencia.descripcion
                            }).usingConnection(db);
                        }
                        avisosCreadosTotales++;
                    };
                    // 4. Lógica de Agrupación basada en los equipos de la LECTURA
                    if (debeAgrupar) {
                        await crearAvisoConEquipos(equipos);
                    } else {
                        for (const eq of equipos) {
                            await crearAvisoConEquipos([eq]);
                        }
                    }
                    // 5. Finalizar asistencia
                    await AsistenciasLecturas.updateOne({ id: asistencia.id })
                    .set({ estado: 'generada' })
                    .usingConnection(db);
                }
            });
            setImmediate(async () => {
                console.log("notificaciones: ",notificaciones)
                for (const nota of notificaciones) {
                    const detallesBase = {
                        folio: nota.folio,
                        cliente: nota.cliente,
                        ubicacion: nota.ubicacionNombre,
                        fecha: moment(nota.fechaAtencion).format('DD/MM/YYYY'),
                        equiposHTML: nota.equiposHTML 
                    };

                    try {
                        if (nota.emailCliente) {
                            await sails.helpers.sendEmail.with({
                                to: nota.emailCliente,
                                subject: `Confirmación de Servicio - Folio ${nota.folio}`,
                                titulo: '¡Servicio Programado!',
                                mensaje: `Hola ${nota.cliente}, se ha generado un aviso de toma de lectura para los siguientes equipos:`,
                                detalles: detallesBase,
                                color: '#28a745'
                            });
                        }
                        if (nota.emailIngeniero) {
                            await sails.helpers.sendEmail.with({
                                to: nota.emailIngeniero,
                                subject: `Nuevo Servicio Asignado - Folio ${nota.folio}`,
                                titulo: 'Nueva Orden de Servicio',
                                mensaje: `Se te ha asignado una toma de lectura para el cliente ${nota.cliente}.`,
                                detalles: detallesBase,
                                color: '#007bff'
                            });
                        }
                        if (nota.emailsCoordinadores.length > 0) {
                            await sails.helpers.sendEmail.with({
                                to: nota.emailsCoordinadores.join(','),
                                subject: `Supervisión: Aviso Generado ${nota.folio}`,
                                titulo: 'Notificación Administrativa',
                                mensaje: `Se ha generado el aviso de lectura folio ${nota.folio}. Ingeniero asignado: ${nota.nombreIngeniero}.`,
                                detalles: detallesBase,
                                color: '#343a40'
                            });
                        }
                    } catch (e) { sails.log.error(e); }
                }
            });
            return res.status(200).send({ resp: 1, cantidad: avisosCreadosTotales});
            //return res.json({ success: true, cantidad: avisosCreadosTotales });
        } catch (err) {
            sails.log.error("Error:", err);
            return res.status(500).json({ error: err.message });
        }
    },
    obtenerAsistencia:async function(req,res){
        let asistencia=await AsistenciasLecturas.findOne({id:req.query.id});
        return res.status(200).send({ resp: 1, asistencia});
    },
    actualizarAsistencia:async function(req,res){
        await AsistenciasLecturas.updateOne({id:req.body.id}).set({
            fechaprevista:req.body.fechaprevista,
            descripcion:req.body.descripcion,
        })
        res.status(200).send();
    },
    agregarAsistencia:async function(req,res){
        let lectura=await Lecturas.findOne({id:req.body.id});
        await AsistenciasLecturas.create({descripcion:req.body.descripcion,fechaprevista:req.body.fechaprevista,lecturas:lectura.id,oficina:lectura.oficina})
        res.status(200).send();
    },
}