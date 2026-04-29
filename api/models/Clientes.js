module.exports = {
  attributes: {
    codigo: { type: 'string'},
    razonsocial: { type: 'string', required: true },
    rfc: { type: 'string' },
    direccion: { type: 'string' },
    telefono: { type: 'string' },
    email: { type: 'string' },
    coordenadas: { type: 'json',defaultsTo:'' },
    horario: { type: 'string',defaultsTo:'' },
    activo: { type: 'number', defaultsTo: 1 },
    moroso: { type: 'boolean', defaultsTo: false },
    tipo: { 
      type: 'string', 
      isIn: ['ARRENDAMIENTO', 'POLIZA', 'TYM'], 
      defaultsTo: 'PROPIO' 
    },
    
    oficina: { model: 'oficinas' },
    ruta: { model: 'rutas' },
    
    // Relaciones
    contactos: { collection: 'clientecontacto', via: 'cliente' },
    ubicaciones: { collection: 'clienteubicacion', via: 'cliente' },
    equipos: { collection: 'equipos', via: 'cliente' },
    //equipos: { collection: 'elementos', via: 'cliente' }
  },
};
