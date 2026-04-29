module.exports = {
  attributes: {
    serie: {
      type: "string",
      required: true,
    },
    usado:{
        type:'string',
        defaultsTo:''
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    oficina:{
        model:'oficinas'
    },
    articulo:{
        model:'articulos'
    }
  },
};