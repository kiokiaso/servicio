// api/models/AsistenciasLecturas.js
module.exports = {
  attributes: {
    descripcion: { type: 'string' },
    fechaprevista: { type: 'ref', columnType: 'datetime', required: true },
    estado: { type: 'string', isIn: ['pendiente', 'completada', 'cancelada','generada'], defaultsTo: 'pendiente' },
    oficina: { type: 'string', required: true },
    lecturas: { model: 'lecturas', required: true },
    activo:{type:'number',defaultsTo:1},
  },
};