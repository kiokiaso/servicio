/**
Helper reutilizable para registrar auditoría
Se puede llamar desde cualquier controller
*/

module.exports = {
  friendlyName: "audit",
  description: 'Mailer something.',
  inputs: {
    usuario: {
      type: 'number',
    },
    accion: {
      type: 'string'
    },
    tabla: {
      type: 'string'
    },
    metodo: {
      type: 'string'
    },
    contenido: {
      type: 'ref'
    },
    navegador:{
      type:'string'
    },
    ip:{
      type:'string'
    },
  },


  exits: {
    success: {
      description: 'All done.',
    },
  },


  fn: async function (inputs) {
    await AuditLog.create({
      usuario: inputs.usuario,
      accion: inputs.accion,
      tabla: inputs.tabla,
      metodo: inputs.metodo,
      contenido: inputs.contenido,
      ip: inputs.ip,
      navegador: inputs.navegador,
      fecha: new Date(),
    });
  },
};
