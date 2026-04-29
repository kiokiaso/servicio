// api/models/Lecturas.js
module.exports = {
  attributes: {
    nombre: { type: 'string', required: true },
    periodicidad: { type: 'string', description: 'Ej: Mensual, Trimestral' },
    cantasistencias: { type: 'number'},
    inicio: { type: 'ref', columnType: 'datetime', description: 'Fecha de inicio del ciclo' },
    fin: { type: 'ref', columnType: 'datetime', description: 'Fecha de fin del ciclo' },
    agruparequipos: { type: 'boolean', defaultsTo: true,description:'Si es true, los equipos que estén relacionados deben agruparse en un solo aviso, si es false, crear un aviso por cada equipo' },
    observaciones: { type: 'string' },
    activo:{
        type:'number',
        defaultsTo:1
    },
    // Relaciones existentes
    oficina: { model: 'oficinas', required: true },
    cliente: { model: 'clientes', required: true },
    ubicacion: { model: 'clienteubicacion', required: true },

    // Relaciones nuevas
    equiposAsignados: { collection: 'equipolecturas', via: 'lecturas' },
    asistencias: { collection: 'asistenciaslecturas', via: 'lecturas' }
  },
};