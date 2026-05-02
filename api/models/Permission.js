/**
Permisos dinámicos del sistema
Ejemplo:
GET /admin/users
POST /admin/users
*/

module.exports = {
  attributes: {
    nombre: {
      type: "string",
    },
    ruta: {
      type: "string",
    },
    metodo: {
      type: "string",
    },
    tipo:{
      type:'string'
    },
    controlador: {
      type: "string",
    },
    accion:{
      type:'string'
    },
    activo:{
      type:"number",
      defaultsTo:1
    },
    roles: {
      collection: "role",
      via: "permisos",
    },
  },
};
