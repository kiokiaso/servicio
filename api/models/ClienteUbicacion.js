module.exports = {
  attributes: {
    nombre: { type: 'string', required: true }, // Ej: "Planta Norte"
    direccion: { type: 'string' },
    coordenadas: { type: 'json',defaultsTo:'' },
    local:{type:'boolean',defaultsTo:true},//OficinaDueña
    localPoliza:{type:'boolean',defaultsTo:false},//Póliza
    activo:{type:'number',defaultsTo:1},
    horario:{type:'string'},
    cliente: { model: 'clientes' },
    oficinaAtencion: { model: 'oficinas' },
    ruta: { model: 'rutas' },
    equipos: { collection: 'equipos', via: 'ubicacion' },
  }
};
