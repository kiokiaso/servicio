// api/models/AsistenciasEquiposLecturas.js
module.exports = {
  attributes: {
    oficina: { type: 'string', required: true },

    // Relación con la vinculación Equipo-Lectura
    equipolecturas: { model: 'equipolecturas', required: true },
    
    // Relación con la fecha programada
    asistencialecturas: { model: 'asistenciaslecturas', required: true }
  },
};