
module.exports = {
  attributes: {
    nombre: {
      type: "string",
      required: true,
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    campos: {
      collection: "camposplantilla",
      via: "plantillas",
    },
    tipoAvisos:{
      model:'tipoavisos',
      required:true
    }
  },
};
