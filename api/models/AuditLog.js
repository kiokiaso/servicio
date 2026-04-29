/**
Bitácora de acciones del sistema
Permite saber:
quién hizo qué, cuándo y desde dónde
*/

module.exports = {
  attributes: {
    usuario: {
      model: "user",
    },
    accion: {
      type: "string",
    },
    tabla: {
      type: "string",
    },
    metodo: {
      type: "string",
    },
    contenido: {
      type: "json",
    },
    ip: {
      type: "string",
    },
    navegador: {
      type: "string",
    },
    fecha: {
      type: "ref",
      columnType: "datetime",
    },
  },
};
