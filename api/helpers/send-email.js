const nodemailer = require('nodemailer');

module.exports = {
  friendlyName: 'Send email',
  inputs: {
    to: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    titulo: { type: 'string', required: true }, // Ej: "Confirmación de Servicio"
    mensaje: { type: 'string', required: true }, // El texto principal
    detalles: { type: 'ref', required: true },   // Objeto con Folio, Cliente, etc.
    color: { type: 'string', defaultsTo: '#007bff' } // Azul por defecto
  },

  fn: async function (inputs) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'kioamadeokiaso@gmail.com', pass: 'djxgxlvtytxtsoxo' }
    });
    const logoUrl = 'https://grupoexi.com/wp-content/uploads/2025/08/LOGO-EXI-PNG_3.png'; // Reemplaza con tu URL real

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
        .header { background-color: ${inputs.color}; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; line-height: 1.6; }
        .table-info { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table-info td { padding: 10px; border-bottom: 1px solid #f4f4f4; }
        .label { font-weight: bold; color: #666; width: 120px; }
        .footer { background-color: #f8f9fa; color: #999; padding: 20px; text-align: center; font-size: 12px; }
        .badge { background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
            <table class="header-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 120px; text-align: left;">
                    <img src="${logoUrl}" alt="Logo" style="display: block; max-height: 60px; width: auto;">
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">${inputs.titulo}</h1>
                    </td>
                </tr>
            </table>
        </div>
        <div class="content">
          <p>${inputs.mensaje}</p>
          <table class="table-info">
            <tr><td class="label">Folio:</td><td><span class="badge" style="color: ${inputs.color};">${inputs.detalles.folio}</span></td></tr>
            <tr><td class="label">Cliente:</td><td>${inputs.detalles.cliente}</td></tr>
            <tr><td class="label">Ubicación:</td><td>${inputs.detalles.ubicacion}</td></tr>
            <tr><td class="label">Fecha:</td><td>${inputs.detalles.fecha}</td></tr>
          </table>
          <div style="margin-top: 20px;">
            <p style="font-weight: bold; margin-bottom: 5px; color: ${inputs.color};">Equipos a revisar:</p>
            ${inputs.detalles.equiposHTML} 
          </div>
        </div>
        
        <div class="footer">
          Este es un correo automático, por favor no responda a este mensaje.<br>
          © ${new Date().getFullYear()} Sistema de Gestión de Servicios
        </div>
      </div>
    </body>
    </html>`;
    try{
      const info= await transporter.sendMail({
        from: '"Servicio Grupo Exi" <no-reply@exi.mx>',
        to: inputs.to,
        subject: inputs.subject,
        html: htmlContent
      }); 
      
      //let seguimiento=await SeguimientoAviso.create(datosSeguimiento).fetch();
      //console.log("Datos: ",datosSeguimiento)
      //console.log("Seguimiento: ",seguimiento)
      return true;
    }catch(error){
      console.log(error)
      return false
    }
    
  }
};
