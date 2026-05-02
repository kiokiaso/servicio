const nodemailer = require('nodemailer');
const fs = require('fs');

module.exports = {


  friendlyName: 'Mailer',


  description: 'Mailer something.',


  inputs: {
    contenido: {
      type: 'string',
    },
    subject: {
      type: 'string'
    },
    correos: {
      type: 'string'
    },
    usuarioId: {
      type: 'number'
    },
    attachments:{
      type:'string'
    },
    usuarioNotificacion:{
      type:'string'
    },

  },


  exits: {
    success: { description: 'Correo enviado correctamente.' },
    error: { description: 'Error al enviar el correo.' }

  },




  fn: async function (inputs) {
   
     const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: 'kioamadeokiaso@gmail.com', pass: 'djxgxlvtytxtsoxo' }
              });
   
    
    const mailOptions = {
        from: '"Servicio Grupo Exi" <no-reply@exi.mx>',
        to: inputs.correos,
        subject: inputs.subject,
        html: inputs.contenido,
        
      };
    try{
      await transporter.sendMail(mailOptions);
      
      return true
    }catch(err){
      sails.log.error('Error al enviar los acceso al usuario:', err);
      return false
    }

}


};
