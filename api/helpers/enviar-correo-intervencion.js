const nodemailer = require('nodemailer');

module.exports = {
  friendlyName: 'Enviar correo intervención',
  description: 'Envía un correo con diseño HTML y el reporte PDF adjunto.',

  inputs: {
    to: { type: 'string', required: true, description: 'Email del destinatario' },
    subject: { type: 'string', required: true, description: 'Asunto del correo' },
    template:{type:'string',required:true},
    templateData: { type: 'ref', required: true, description: 'Datos para la plantilla EJS' },
    attachments: { type: 'ref', description: 'Arreglo de archivos adjuntos' }
  },

  exits: {
    success: { description: 'Correo enviado correctamente.' },
    error: { description: 'Error al enviar el correo.' }
  },

  fn: async function (inputs, exits) {
    try {
      // 1. Configuración del Transportador (Ajusta con tus datos de SMTP)
      
       const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'kioamadeokiaso@gmail.com', pass: 'djxgxlvtytxtsoxo' }
          });

      // 2. Renderizar el HTML usando el template EJS
      // Nota: 'email-reporte' debe estar en views/email-reporte.ejs
      const htmlBody = await sails.renderView(inputs.template, {
        ...inputs.templateData,
        layout: false // No queremos el layout general de la web
      });

      // 3. Configurar el envío
      const mailOptions = {
        from: '"Servicio Grupo Exi" <no-reply@exi.mx>',
        to: inputs.to,
        subject: inputs.subject,
        html: htmlBody,
        attachments: inputs.attachments || []
      };

      // 4. Enviar
      await transporter.sendMail(mailOptions);
      
      return exits.success();
    } catch (err) {
      sails.log.error('Error en helper enviar-correo-intervencion:', err);
      return exits.error(err);
    }
  }
};
