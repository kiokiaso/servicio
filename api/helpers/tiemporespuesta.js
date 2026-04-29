const moment = require('moment');

module.exports = {
  friendlyName: 'Get business hours',
  inputs: {
    inicio: { type: 'string', required: true, description: 'YYYY-MM-DD HH:mm:ss' },
    fin: { type: 'string', required: true }
  },

  fn: async function (inputs) {
    const { inicio, fin } = inputs;
    let fechaActual = moment(inicio);
    const fechaFin = moment(fin);
    let minutosTotales = 0;

    // 1. Obtener días festivos de la BD (asumiendo formato 'YYYY-MM-DD')
    const festivosRecords = await Festivos.find();
    const listaFestivos = festivosRecords.map(f => moment(f.fecha).format('YYYY-MM-DD'));

    // 2. Obtener horarios de la BD
    const horarioOficina = await Oficina.findOne({ id: 1 }); 
    // Ejemplo de estructura esperada en BD: 
    // { lv_inicio: '09:00', lv_fin: '18:00', sab_inicio: '09:00', sab_fin: '13:00' }

    while (fechaActual.isBefore(fechaFin)) {
      const fechaString = fechaActual.format('YYYY-MM-DD');
      const diaSemana = fechaActual.day(); // 0: Dom, 1-5: L-V, 6: Sab

      // Saltamos domingos y festivos
      if (diaSemana === 0 || listaFestivos.includes(fechaString)) {
        fechaActual.add(1, 'day').startOf('day').add(9, 'hours'); // Siguiente día a las 9am
        continue;
      }

      let hInicio, hFin;
      if (diaSemana >= 1 && diaSemana <= 5) {
        hInicio = horarioOficina.lv_inicio;
        hFin = horarioOficina.lv_fin;
      } else {
        hInicio = horarioOficina.sab_inicio;
        hFin = horarioOficina.sab_fin;
      }

      // Convertir strings de BD a objetos moment del día actual
      const apertura = moment(`${fechaString} ${hInicio}`, 'YYYY-MM-DD HH:mm');
      const cierre = moment(`${fechaString} ${hFin}`, 'YYYY-MM-DD HH:mm');

      // Calcular intersección entre el rango de trabajo y el rango de la tarea
      const inicioRango = moment.max(fechaActual, apertura);
      const finRango = moment.min(fechaFin, cierre);

      if (inicioRango.isBefore(finRango)) {
        minutosTotales += finRango.diff(inicioRango, 'minutes');
      }

      // Avanzar al inicio de la jornada del día siguiente
      fechaActual.add(1, 'day').hour(moment(hInicio, 'HH:mm').hour()).minute(moment(hInicio, 'HH:mm').minute());
    }

    return (minutosTotales / 60).toFixed(2);
  }
};
