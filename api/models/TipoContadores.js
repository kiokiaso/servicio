module.exports = {
  attributes: {
    nombre: {
      type: "string",
    },
    tipocontador: {
      type: "string",//{Entrada,Salida,Toner,Lectura}
    },
    variable:{
      type:'string'
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