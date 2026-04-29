
module.exports.cron = {
  notificarGeneracionAvisos: {
    // Programación: Cada minuto  '* * * * *' y para las 6 am de cada día '0 6 * * *'
    schedule: '0 6 * * *', 
    
    // Función que se ejecuta
    onTick: async function() {
      const moment = require('moment-timezone');
      const zona = 'America/Mexico_City';
      let notificaciones = [];
      let avisosCreadosTotales = 0;
      
      // Para el día de hoy
      //const hoyInicio = moment().tz(zona).startOf('day').toDate();
      //const hoyFin = moment().tz(zona).endOf('day').toDate();
      //Para un día después
      const hoyInicio = moment().tz(zona).add(1,'days').startOf('day').toDate();
      const hoyFin = moment().tz(zona).add(1,'days').endOf('day').toDate();

      try {
        const asistenciasHoy = await AsistenciasLecturas.find({
          where: {
            estado: 'pendiente',
            activo:1,
            fechaprevista: {
              '>=': hoyInicio,
              '<=': hoyFin
            }
          },
          select:['id']
        })
        const idsAsistencias = asistenciasHoy.map(a => a.id);
            await sails.getDatastore().transaction(async (db) => {
                const asistencias = await AsistenciasLecturas.find({ 
                    id: idsAsistencias,
                    estado: 'pendiente',
                    activo:1
                }) .populate('lecturas') .usingConnection(db);
                if (asistencias.length === 0) {
                    throw new Error('No hay asistencias pendientes para procesar.');
                }
                for (const asistencia of asistencias) {
                    const idOficinaAsistencia = asistencia.oficina;  
                    const lecturaCompleta = await Lecturas.findOne({ id: asistencia.lecturas.id }).populate('equiposAsignados').populate('cliente').usingConnection(db);
                    const equipos = lecturaCompleta.equiposAsignados || [];
                    if (equipos.length === 0) {
                        sails.log.warn(`La asistencia ${asistencia.id} no tiene equipos en su lectura.`);
                        continue; 
                    }
                    const ub = await ClienteUbicacion.findOne({ id: asistencia.lecturas.ubicacion }).populate('ruta').populate('oficinaAtencion');
                    const coords = await User.find({
                      where:{
                        or: [
                            { oficinas: idOficinaAsistencia, coordinador: true },
                            { oficinas: ub.oficinaAtencion ? ub.oficinaAtencion.id : null, coordinador: true }
                        ],
                        activo:1
                      }
                    }).usingConnection(db);
                    const ultimoAvisoOficina = await Avisos.find({ oficina: idOficinaAsistencia }).sort('folio DESC').limit(1).usingConnection(db);
                    let siguienteFolio = parseInt(ultimoAvisoOficina[0]?.folio || 0) + 1;
                    const debeAgrupar = asistencia.lecturas.agruparequipos;
                    const crearAvisoConEquipos = async (listaDeEquipos) => {
                        let ub=await ClienteUbicacion.findOne({id:asistencia.lecturas.ubicacion}).populate('ruta');
                        const nuevoAviso = await Avisos.create({
                            folio: siguienteFolio++,
                            tipoAviso: 3,
                            asistencia: asistencia.id,
                            oficina: idOficinaAsistencia,
                            cliente:asistencia.lecturas.cliente,
                            ubicacion:asistencia.lecturas.ubicacion,
                            fechaAtencion:asistencia.fechaprevista,
                            //creadoPor:req.session.usuario.id,
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
                            aviso:nuevoAviso.id,
                            cliente: lecturaCompleta.cliente.razonsocial,
                            ubicacionNombre: ub.nombre,
                            fechaAtencion: asistencia.fechaprevista,
                            equiposHTML: tablaEquiposHTML,
                            emailCliente: lecturaCompleta.cliente.email || null,
                            emailIngeniero: tecnico?.email || null,
                            nombreIngeniero: tecnico ? `${tecnico.nombre}` : 'No asignado',
                            emailsCoordinadores: listaEmailsCoordinadores,
                            trEstimado:equiposDetallados[0].trEstimado,
                            trPoliza:equiposDetallados[0].trPoliza
                        });
                        for (const eq of listaDeEquipos) {
                            await AvisoEquipo.create({
                                aviso: nuevoAviso.id,
                                equipo: eq.equipo,
                                oficina: idOficinaAsistencia,
                                tipoProblema: 9,
                                observaciones:asistencia.descripcion,
                                trEstimado:equiposDetallados[0].trEstimado,
                                trPoliza:equiposDetallados[0].trPoliza
                            }).usingConnection(db);
                        }
                        avisosCreadosTotales++;
                    };
                    if (debeAgrupar) {
                        await crearAvisoConEquipos(equipos);
                    } else {
                        for (const eq of equipos) {
                            await crearAvisoConEquipos([eq]);
                        }
                    }
                    await AsistenciasLecturas.updateOne({ id: asistencia.id }).set({ estado: 'generada' }) .usingConnection(db);
                }
            });
        setImmediate(async () => {
            for (const nota of notificaciones) {
              const detallesBase = {
                  folio: nota.folio,
                  cliente: nota.cliente,
                  ubicacion: nota.ubicacionNombre,
                  fecha: moment(nota.fechaAtencion).format('DD/MM/YYYY'),
                  equiposHTML: nota.equiposHTML,
                  aviso:nota.aviso,
                  usuario:0
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
      } catch (err) {
        console.error('❌ Error en la tarea programada:', err);
      }
      console.log('------------------------------------------------');
    },
    start: true,
    timezone: 'America/Mexico_City'
  }
};