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
    razonsocial:{
        type:'string'
    },
    horariolventrada:{
        type:'string'
    },
    horariolvsalida:{
        type:'string'
    },
    horariosabadoentrada:{
        type:'string'
    },
    horariosabadosalida:{
        type:'string'
    },
    tiemporespuesta:{
        type:'number'
    },
    tiemposolucion:{
        type:'number'
    },
    rfc:{
        type:'string'
    },
    planificaraviso:{//Días antes de la fecha de asistencia
        type:'number',
        defaultsTo:1
    },
    user: {
      collection: "user",
      via: "accesooficinas",
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
  },
};
/*
Descontando hora de comida, pasando las horas de inicio y fin en números de segundos
const moment = require('moment');

module.exports = {
  inputs: {
    inicioSegundos: { type: 'number', required: true }, // Ejemplo: 1773416160
    finSegundos: { type: 'number', required: true }    // Ejemplo: 1773765600
  },

  fn: async function (inputs) {
    let fechaActual = moment.unix(inputs.inicioSegundos);
    const fechaFin = moment.unix(inputs.finSegundos);
    let minutosTotales = 0;

    // 1. Cargar Festivos y Configuración de Oficina
    const festivos = (await Festivos.find()).map(f => moment(f.fecha).format('YYYY-MM-DD'));
    const config = await Oficina.findOne({ id: 1 }); 
    // Campos esperados: lv_inicio, lv_fin, sab_inicio, sab_fin, hora_comida (ej: "14:00")

    while (fechaActual.isBefore(fechaFin)) {
      const hoyStr = fechaActual.format('YYYY-MM-DD');
      const diaSemana = fechaActual.day(); // 0:Dom, 1-5:L-V, 6:Sab

      // Saltamos domingos y festivos
      if (diaSemana === 0 || festivos.includes(hoyStr)) {
        fechaActual.add(1, 'day').startOf('day');
        continue;
      }

      // 2. Determinar horario del día
      const esSabado = (diaSemana === 6);
      const hApertura = esSabado ? config.sab_inicio : config.lv_inicio;
      const hCierre = esSabado ? config.sab_fin : config.lv_fin;

      const apertura = moment(`${hoyStr} ${hApertura}`, 'YYYY-MM-DD HH:mm');
      const cierre = moment(`${hoyStr} ${hCierre}`, 'YYYY-MM-DD HH:mm');

      // 3. Calcular tiempo laborable del día
      const inicioRango = moment.max(fechaActual, apertura);
      const finRango = moment.min(fechaFin, cierre);

      if (inicioRango.isBefore(finRango)) {
        let minutosDia = finRango.diff(inicioRango, 'minutes');

        // 4. Descontar hora de comida (Solo si el rango cruza la hora de comida)
        // Asumimos que la comida dura 60 minutos
        if (config.hora_comida) {
          const inicioComida = moment(`${hoyStr} ${config.hora_comida}`, 'YYYY-MM-DD HH:mm');
          const finComida = inicioComida.clone().add(1, 'hour');

          // Si el tiempo trabajado se cruza con el horario de comida, restamos 60 min
          if (inicioRango.isBefore(finComida) && finRango.isAfter(inicioComida)) {
            minutosDia -= 60;
          }
        }

        minutosTotales += Math.max(0, minutosDia);
      }

      // Avanzar al siguiente día
      fechaActual.add(1, 'day').startOf('day');
    }

    return (minutosTotales / 60).toFixed(2);
  }

  Controlador
  // api/controllers/TicketController.js
const horasHabiles = await sails.helpers.getBusinessHours(
  '2026-03-13 09:36:00', 
  '2026-03-17 10:40:00'
);
// El 13 de marzo de 2026 a las 09:36 AM en segundos es 1773416160
const horas = await sails.helpers.getBusinessHours(1773416160, 1773765600);
return res.ok({ horas_habiles: horas });

console.log(`Tiempo de resolución: ${horasHabiles} horas.`);

};


*/


/*
    CALCULANDO SI LA HORA DE INICIO Y FIN NO ESTA DENTRO DE LA HORA DE COMIDA
    const moment = require('moment');

module.exports = {
  inputs: {
    inicioSegundos: { type: 'number', required: true },
    finSegundos: { type: 'number', required: true }
  },

  fn: async function (inputs) {
    let fechaActual = moment.unix(inputs.inicioSegundos);
    const fechaFin = moment.unix(inputs.finSegundos);
    let minutosTotales = 0;

    const festivos = (await Festivos.find()).map(f => moment(f.fecha).format('YYYY-MM-DD'));
    const config = await Oficina.findOne({ id: 1 }); 
    // Campos: lv_inicio, lv_fin, sab_inicio, sab_fin, hora_comida (ej: "14:00")

    while (fechaActual.isBefore(fechaFin)) {
      const hoyStr = fechaActual.format('YYYY-MM-DD');
      const diaSemana = fechaActual.day(); 

      if (diaSemana === 0 || festivos.includes(hoyStr)) {
        fechaActual.add(1, 'day').startOf('day');
        continue;
      }

      const esSabado = (diaSemana === 6);
      const hApertura = esSabado ? config.sab_inicio : config.lv_inicio;
      const hCierre = esSabado ? config.sab_fin : config.lv_fin;

      const apertura = moment(`${hoyStr} ${hApertura}`, 'YYYY-MM-DD HH:mm');
      const cierre = moment(`${hoyStr} ${hCierre}`, 'YYYY-MM-DD HH:mm');

      // Rango efectivo de trabajo del día
      let inicioRango = moment.max(fechaActual, apertura);
      let finRango = moment.min(fechaFin, cierre);

      if (inicioRango.isBefore(finRango)) {
        let minutosDia = finRango.diff(inicioRango, 'minutes');

        // --- LÓGICA DE HORA DE COMIDA ---
        if (config.hora_comida) {
          const inicioComida = moment(`${hoyStr} ${config.hora_comida}`, 'YYYY-MM-DD HH:mm');
          const finComida = inicioComida.clone().add(1, 'hour');

          // SOLO RESTAR SI:
          // El usuario empezó ANTES de que termine la comida 
          // Y terminó DESPUÉS de que empezó la comida
          if (inicioRango.isBefore(finComida) && finRango.isAfter(inicioComida)) {
            
            // Calculamos cuánto de ese tiempo de comida cae dentro de su horario
            const traslapeInicio = moment.max(inicioRango, inicioComida);
            const traslapeFin = moment.min(finRango, finComida);
            const minutosParaRestar = traslapeFin.diff(traslapeInicio, 'minutes');

            minutosDia -= minutosParaRestar;
          }
        }

        minutosTotales += Math.max(0, minutosDia);
      }

      // Siguiente día a las 00:00 para reiniciar el ciclo
      fechaActual.add(1, 'day').startOf('day');
    }

    return (minutosTotales / 60).toFixed(2);
  }
};

*/

/*
    controlador desde donde se hará la llamada
    module.exports = {
  calcularTiempos: async function (req, res) {
    const { fechaInicio, fechaFin } = req.allParams(); // Timestamps en segundos

    // 1. Cargar datos base una sola vez
    const [avisos, oficina, festivosRaw] = await Promise.all([
      Avisos.find({ createdAt: { '>=': fechaInicio, '<=': fechaFin } }),
      Oficina.findOne({ id: 1 }),
      Festivos.find()
    ]);

    const festivos = festivosRaw.map(f => moment(f.fecha).format('YYYY-MM-DD'));

    // 2. Procesar masivamente usando el Helper
    // Usamos Promise.all para que corran en paralelo si el helper es async
    const avisosConTiempo = await Promise.all(avisos.map(async (aviso) => {
      
      // Supongamos que comparamos desde su creación hasta ahora (o una fecha de cierre)
      const tiempoHabilitado = await sails.helpers.getBusinessHours(
        aviso.createdAt, // inicio en segundos
        Math.floor(Date.now() / 1000) // fin (ahora) en segundos
      );

      return {
        ...aviso,
        tiempo_respuesta_horas: tiempoHabilitado
      };
    }));

    return res.ok(avisosConTiempo);
  }
};
Helper
// En el helper: añade estos inputs opcionales
inputs: {
  inicioSegundos: { type: 'number', required: true },
  finSegundos: { type: 'number', required: true },
  configOficina: { type: 'ref' }, // Opcional: pasar el objeto oficina ya cargado
  listaFestivos: { type: 'ref' }  // Opcional: pasar el array de festivos ya cargado
},

fn: async function (inputs) {
  // Si me pasaron los datos, los uso; si no, los busco (fallback)
  const config = inputs.configOficina || await Oficina.findOne({ id: 1 });
  const festivos = inputs.listaFestivos || (await Festivos.find()).map(f => moment(f.fecha).format('YYYY-MM-DD'));
  
  // ... resto de la lógica del while ...
}

*/

/*
OPTIMIZADO PARA NO MÁS DE 1000 REGISTROS
HELPER
const moment = require('moment');

module.exports = {
  inputs: {
    inicio: { type: 'number', required: true },
    fin: { type: 'number', required: true },
    config: { type: 'ref', required: true }, // Objeto de la tabla Oficina
    festivos: { type: 'ref', required: true } // Array de strings ['YYYY-MM-DD']
  },

  fn: async function (inputs) {
    let fechaActual = moment.unix(inputs.inicio);
    const fechaFin = moment.unix(inputs.fin);
    const { config, festivos } = inputs;
    let minutosTotales = 0;

    while (fechaActual.isBefore(fechaFin)) {
      const hoyStr = fechaActual.format('YYYY-MM-DD');
      const diaSemana = fechaActual.day();

      if (diaSemana === 0 || festivos.includes(hoyStr)) {
        fechaActual.add(1, 'day').startOf('day');
        continue;
      }

      const esSabado = (diaSemana === 6);
      const hApertura = esSabado ? config.sab_inicio : config.lv_inicio;
      const hCierre = esSabado ? config.sab_fin : config.lv_fin;

      const apertura = moment(`${hoyStr} ${hApertura}`, 'YYYY-MM-DD HH:mm');
      const cierre = moment(`${hoyStr} ${hCierre}`, 'YYYY-MM-DD HH:mm');

      let inicioRango = moment.max(fechaActual, apertura);
      let finRango = moment.min(fechaFin, cierre);

      if (inicioRango.isBefore(finRango)) {
        let minutosDia = finRango.diff(inicioRango, 'minutes');

        if (config.hora_comida) {
          const inicioComida = moment(`${hoyStr} ${config.hora_comida}`, 'YYYY-MM-DD HH:mm');
          const finComida = inicioComida.clone().add(1, 'hour');

          if (inicioRango.isBefore(finComida) && finRango.isAfter(inicioComida)) {
            const tInicio = moment.max(inicioRango, inicioComida);
            const tFin = moment.min(finRango, finComida);
            minutosDia -= tFin.diff(tInicio, 'minutes');
          }
        }
        minutosTotales += Math.max(0, minutosDia);
      }
      fechaActual.add(1, 'day').startOf('day');
    }
    return parseFloat((minutosTotales / 60).toFixed(2));
  }
};


CONTROLADOR
module.exports = {
  reporteAvisos: async function (req, res) {
    const { desde, hasta } = req.allParams(); // Rango de búsqueda en segundos

    // 1. Cargas masivas iniciales
    const [avisos, configOficina, festivosRaw] = await Promise.all([
      Avisos.find({ createdAt: { '>=': desde, '<=': hasta } }),
      Oficina.findOne({ id: 1 }), // O el ID de la oficina correspondiente
      Festivos.find()
    ]);

    const listaFestivos = festivosRaw.map(f => moment(f.fecha).format('YYYY-MM-DD'));

    // 2. Mapear y calcular (Aprox. 100-1000 registros)
    const resultados = await Promise.all(avisos.map(async (aviso) => {
      // Calculamos desde que se creó el aviso hasta el tiempo actual (o fecha de cierre)
      const ahora = Math.floor(Date.now() / 1000);
      
      const horas = await sails.helpers.getBusinessHours(
        aviso.createdAt, 
        ahora, 
        configOficina, 
        listaFestivos
      );

      return {
        ...aviso,
        horas_transcurridas: horas
      };
    }));

    return res.view('sistema/avisos/reporte', { datos: resultados });
  }
};

*/

/*
    PARA VER SI ES LOCAL FORANEO EL TIEMPO DE RESPUESTA TAMBIÉN SI ES COLOR O MONOCROMO, CREAR UNA TABLA CON ESO, MOSTRAR CANTIDAD DE AVISOS QUE EXCECEN DEL PROMEDIO DE LA OFICINA

    //CONTROLADOR
    const moment = require('moment');

module.exports = {
  reporteEficiencia: async function (req, res) {
    const { inicio, fin } = req.allParams(); // Rango en segundos

    // 1. Carga masiva de datos necesarios
    const [avisos, configOficina, festivosRaw] = await Promise.all([
      Avisos.find({ 
        createdAt: { '>=': inicio, '<=': fin },
        tipo: 'averia' // Solo avisos de avería
      }).populate('cliente').populate('elementos'),
      Oficina.findOne({ id: 1 }),
      Festivos.find()
    ]);

    const listaFestivos = festivosRaw.map(f => moment(f.fecha).format('YYYY-MM-DD'));
    const ahora = Math.floor(Date.now() / 1000);

    // 2. Contadores para la gráfica
    let conteoExcede = 0;
    let conteoNormal = 0;

    // 3. Procesar cada aviso
    const avisosProcesados = await Promise.all(avisos.map(async (aviso) => {
      // Calcular tiempo de respuesta real (de creación a "ahora" o fecha_cierre)
      const finCalculo = aviso.fecha_cierre || ahora;
      const horasReales = await sails.helpers.getBusinessHours(
        aviso.createdAt, 
        finCalculo, 
        configOficina, 
        listaFestivos
      );

      // Definir tiempo límite según reglas del elemento
      // Asumiendo que el primer elemento define la regla o el aviso tiene estos campos
      let limiteHoras = configOficina.promedio_general; // Base por defecto

      // Lógica de penalización/beneficio por tipo
      if (aviso.ubicacion === 'foraneo') limiteHoras += configOficina.extra_foraneo; // ej: +24h
      if (aviso.tipo_impresion === 'color') limiteHoras += configOficina.extra_color; // ej: +4h

      const excede = horasReales > limiteHoras;
      
      if (excede) conteoExcede++; else conteoNormal++;

      return {
        id: aviso.id,
        cliente: aviso.cliente ? aviso.cliente.nombre : 'S/N',
        elementos: aviso.elementos.map(e => e.modelo).join(', '),
        tiempoRespuesta: horasReales,
        limite: limiteHoras,
        excede: excede
      };
    }));

    return res.view('sistema/avisos/grafica_reporte', {
      avisos: avisosProcesados,
      stats: { excede: conteoExcede, normal: conteoNormal },
      rango: { inicio, fin }
    });
  }
};


//VISTA
<!-- 1. Gráfica de Pay -->
<div style="width: 400px; margin: auto;">
  <canvas id="graficaAvisos"></canvas>
</div>

<!-- 2. Tabla de Avisos -->
<table class="table table-striped mt-4">
  <thead>
    <tr>
      <th>ID</th>
      <th>Cliente</th>
      <th>Elementos</th>
      <th>Tiempo Respuesta (Hrs)</th>
      <th>Límite Esperado</th>
    </tr>
  </thead>
  <tbody>
    <% avisos.forEach(aviso => { %>
      <tr class="<%= aviso.excede ? 'table-danger text-danger' : '' %>">
        <td><%= aviso.id %></td>
        <td><%= aviso.cliente %></td>
        <td><%= aviso.elementos %></td>
        <td><strong><%= aviso.tiempoRespuesta %> hrs</strong></td>
        <td><%= aviso.limite %> hrs</td>
      </tr>
    <% }) %>
  </tbody>
</table>

<script src="https://cdn.jsdelivr.net"></script>
<script>
  const ctx = document.getElementById('graficaAvisos').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Excede Límite', 'Dentro de Tiempo'],
      datasets: [{
        data: [<%= stats.excede %>, <%= stats.normal %>],
        backgroundColor: ['#dc3545', '#28a745']
      }]
    }
  });
</script>

*/