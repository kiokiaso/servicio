/**
 * User.js
 *
 * A user who can log in to this application.
 */

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
  },
};
