module.exports = {
  attributes: {
    nombre: {
      type: "string",
    },
    duracion: {
      type: "string",
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    tipoAvisos:{
      model:'tipoavisos',
      required:true
    }
  },
};