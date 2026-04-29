const puppeteer = require('puppeteer');

module.exports = {
  friendlyName: 'Generar PDF',
  description: 'Convierte un string HTML en un buffer de PDF usando Puppeteer.',

  inputs: {
    html: {
      type: 'string',
      required: true,
      description: 'El contenido HTML renderizado desde EJS.'
    }
  },

  exits: {
    success: {
      description: 'PDF generado correctamente como Buffer.'
    },
    error: {
      description: 'Error al procesar el PDF.'
    }
  },

  fn: async function (inputs, exits) {
    let browser;
    try {
      // Lanzar el navegador en modo "headless" (sin ventana)
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necesario para Linux/Heroku
        headless: "new"
      });

      const page = await browser.newPage();

      // Establecer el contenido HTML
      await page.setContent(inputs.html, { waitUntil: 'networkidle0' });

      // Generar el PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // CRÍTICO: Para que se vea el color #0067c6
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm'
        }
      });

      await browser.close();
      return exits.success(pdfBuffer);

    } catch (err) {
      if (browser) await browser.close();
      sails.log.error('Error en helper generar-pdf:', err);
      return exits.error(err);
    }
  }
};
