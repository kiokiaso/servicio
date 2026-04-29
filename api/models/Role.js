/**
Modelo de Roles
Define perfiles del sistema
*/

module.exports = {
  attributes: {
    nombre: {
      type: "string",
      required: true,
    },
    activo:{
      type:"number",
      defaultsTo:1
    },
    descripcion: {
      type: "string",
    },
    /*
      Relación muchos a muchos con permisos
    */
    permisos: {
      collection: "permission",
      via: "roles",
    },

  },
};
