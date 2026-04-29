
module.exports = {
  attributes: {
    codigo:{
        type:'string'
    },
    nombre: {
      type: "string",
    },
    descripcion:{
        type:'string'
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    usuario:{
        model:'user',
        columnName:'usuarioId'
    },
    oficina:{
        model:'oficinas',
        columnName:'oficinaId'
    },
  },
};