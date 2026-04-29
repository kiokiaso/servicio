module.exports = {
  attributes: {
    nombre: {
      type: "string",
    },
    tipo: {
      type: "string",//number o botones
    },
    max:{
        type:'number',
        defaultsTo:0
    },
    min:{
        type:'number',
        defaultsTo:100
    },
    orden:{
        type:'number',
        defaultsTo:1
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    plantillas:{
      model:'plantillas',
      required:true
    }
  },
};