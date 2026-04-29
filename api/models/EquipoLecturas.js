// api/models/EquipoLecturas.js
module.exports = {
  attributes: {
    oficina: { type: 'string', required: true },

    // Relaciones
    equipo: { model: 'equipos', required: true },
    lecturas: { model: 'lecturas', required: true },

    // Para saber en qué asistencias específicas participó este equipo
    detallesAsistencias: { collection: 'asistenciasequiposlecturas', via: 'equipolecturas' }
  },
};