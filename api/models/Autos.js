

module.exports = {
  attributes: {
    placa:{
        type:'string'
    },
    descripcion:{
        type:'string'
    },
    kilometraje:{
        type:'number'
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    oficina:{
        model:'oficinas',
        columnName:'oficinaId'
    },
    registroKilometraje:{
        collection:'kilometraje',
        via:'auto'
    }
  },
};