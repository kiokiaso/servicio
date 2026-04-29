/**
 * api/models/ChatMessage.js
 *
 * Modelo para persistir el historial de conversaciones 1 a 1.
 */

module.exports = {

  attributes: {

    texto: {
      type: 'string',
      required: true,
      description: 'Contenido del mensaje de chat.'
    },

    // El usuario que envía el mensaje
    de: {
      model: 'user', // Nombre del modelo de tus usuarios
      required: true
    },

    // El usuario que recibe el mensaje
    para: {
      model: 'user', // Nombre del modelo de tus usuarios
      required: true
    },

    // Opcional: Para saber si el destinatario ya leyó el mensaje
    leido: {
      type: 'boolean',
      defaultsTo: false
    }

  },
};
