module.exports = {
  equipos: async function (req, res) {
    const oficinaId = req.oficinaElegida.id;
    const ubicacionesAtendidas = await ClienteUbicacion.find({
      oficinaAtencion: oficinaId,
      activo: 1,
    });
    const idsUbicacionesForaneas = ubicacionesAtendidas.map((u) => u.id);
    const equipos = await Equipos.find({
      where: {
        activo: 1,
        baja: false,
        or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }],
      },
    })
      .populate("cliente")
      .populate("ubicacion")
      .populate("oficina")
      .populate("articulo");
    const resultadoFinal = equipos.filter((e) => {
      const clienteActivo = e.cliente && e.cliente.activo === 1;
      const ubicacionActiva = e.ubicacion && e.ubicacion.activo === 1;
      return clienteActivo && ubicacionActiva;
    });
    //console.log(resultadoFinal)
    //let tipoContacto=await TipoContacto.find({activo:1})
    //let rutas=await Rutas.find({activo:1,oficina:oficinaId})
    let plantillas = await Plantillas.find({ activo: 1 });
    return res.view("pages/equipos/equipos", {
      equipos: resultadoFinal,
      plantillas,
    });
  },
  equiposBajas: async function (req, res) {
    const oficinaId = req.oficinaElegida.id;
    const ubicacionesAtendidas = await ClienteUbicacion.find({
      oficinaAtencion: oficinaId,
      activo: 1,
    });
    const idsUbicacionesForaneas = ubicacionesAtendidas.map((u) => u.id);
    const equipos = await Equipos.find({
      where: {
        activo: 1,
        baja: true,
        or: [{ oficina: oficinaId }, { ubicacion: idsUbicacionesForaneas }],
      },
    })
      .populate("cliente")
      .populate("ubicacion")
      .populate("oficina")
      .populate("articulo");
    const resultadoFinal = equipos.filter((e) => {
      const clienteActivo = e.cliente && e.cliente.activo === 1;
      const ubicacionActiva = e.ubicacion && e.ubicacion.activo === 1;
      return clienteActivo && ubicacionActiva;
    });
    //console.log(resultadoFinal)
    //let tipoContacto=await TipoContacto.find({activo:1})
    //let rutas=await Rutas.find({activo:1,oficina:oficinaId})
    let plantillas = await Plantillas.find({ activo: 1 });
    return res.view("pages/equipos/bajas", {
      equipos: resultadoFinal,
      plantillas,
    });
  },
  ficha: async function (req, res) {
    // 1. Buscamos el equipo y ordenamos los contadores por fecha de creación descendente
    // Esto asegura que el primer contador que encontremos de cada tipo sea el más reciente.
    let equipos = await Equipos.findOne({ id: req.params.id })
      .populate("ubicacion")
      .populate("cliente")
      .populate("oficina")
      .populate("articulo")
      .populate("plantillas")
      .populate("equiposAviso")
      .populate("contadores", { sort: 'createdAt DESC' }); // Orden crucial
    
    if (!equipos) { return res.notFound(); }

    // --- LÓGICA DE FILTRADO PARA CONTADORES RECIENTES ---
    const ultimosContadores = [];
    const tiposProcesados = new Set();

    // Filtramos para dejar solo el más reciente de cada tipo
    equipos.contadores.forEach(c => {
      if (!tiposProcesados.has(c.tipoContador)) {
        tiposProcesados.add(c.tipoContador);
        ultimosContadores.push(c);
      }
    });

    // Reemplazamos el array original por el filtrado para no cargar datos innecesarios a la vista
    equipos.contadores = ultimosContadores;

    await Promise.all([
        // Detalles de Avisos
        ...equipos.equiposAviso.map(async (ev) => {
            const detalleAviso = await Avisos.findOne({ id: ev.aviso })
                .populate('tipoAviso')
                .populate('atendidoPor')
                .populate('cliente')
                .populate('ubicacion');
            ev.aviso = detalleAviso;
        }),

        // Detalles de Contadores (Solo de los más recientes)
        ...equipos.contadores.map(async (cont) => {
            const detalleTipo = await TipoContadores.findOne({ id: cont.tipoContador }).populate('tipoAvisos');
            // Inyectamos el objeto con id y nombre
            cont.tipoContador = detalleTipo ? { id: detalleTipo.id, nombre: detalleTipo.nombre,tipo:detalleTipo.tipocontador,tipoAviso:detalleTipo.tipoAvisos.nombre } : { id: cont.tipoContador, nombre: 'N/A' };
        })
    ]);

    let ubicaciones = await ClienteUbicacion.find({
      cliente: equipos.cliente.id,
      activo: 1,
    });
    
    let plantillas = await Plantillas.find({ activo: 1 });

    return res.view("pages/equipos/ficha", {
      equipos: equipos,
      ubicaciones,
      plantillas,
    });
  },
  fichaold: async function (req, res) {
    let equipos = await Equipos.findOne({ id: req.params.id })
      .populate("ubicacion")
      .populate("cliente")
      .populate("oficina")
      .populate("articulo")
      .populate("plantillas")
      .populate("equiposAviso")
      .populate("contadores");
    
    await Promise.all([
        // Detalles de Avisos
        ...equipos.equiposAviso.map(async (ev) => {
        // Asumiendo que 'aviso' es el ID en la tabla EquiposAviso
            const detalleAviso = await Avisos.findOne({ id: ev.aviso })
                .populate('tipoAviso')
                .populate('atendidoPor')
                .populate('cliente')
                .populate('ubicacion');
            ev.aviso = detalleAviso;
        }),

        // Detalles de Contadores
        ...equipos.contadores.map(async (cont) => {
            const detalleTipo = await TipoContadores.findOne({ id: cont.tipoContador });
            cont.tipoContador = detalleTipo; // Reemplaza el ID con el objeto completo (incluyendo el nombre)
        })
        
    ]);
   

    let ubicaciones = await ClienteUbicacion.find({
      cliente: equipos.cliente.id,
      activo: 1,
    });
    let plantillas = await Plantillas.find({ activo: 1 });
    console.log("datos del equipo", ubicaciones);
    return res.view("pages/equipos/ficha", {
      equipos: equipos,
      ubicaciones,
      plantillas,
    });
  },
  crearDesdeCliente: async function (req, res) {
    let datos = req.body;
    datos.oficina = datos.oficinaEquipo;
    datos.articulo = datos.articuloId;
    datos.series = datos.serieId;
    datos.cliente = datos.clienteEquipo;
    datos.ubicacion = datos.ubicacionEquipo;
    delete datos.oficinaEquipo;
    delete datos.articuloId;
    delete datos.serieId;
    delete datos.clienteEquipo;
    delete datos.ubicacionEquipo;
    let equipo;
    //let ubic=await ClienteUbicacion.findOne({id:datos.ubicacion});
    /*if(datos.tipocolor=='Monocromo'){
            if(ubic.oficinaAtencion=!null){
                if(ubic.local==true){
                    trLocal=360
                }else{
                    trLocal=600
                }
                trPoliza=0
            }else{
                if(ubic.local==true){
                    trLocal=360
                }else{
                    trLocal=600
                }
                if(ubic.localPoliza==true){
                    trPoliza=360
                }else{
                    trPoliza=600
                }
            }
        }else{
            if(ubic.oficinaAtencion=!null){
                if(ubic.local==true){
                    trLocal=240
                }else{
                    trLocal=480
                }
                trPoliza=0
            }else{
                if(ubic.local==true){
                    trLocal=240
                }else{
                    trLocal=480
                }
                if(ubic.localPoliza==true){
                    trPoliza=240
                }else{
                    trPoliza=480
                }
            }
        }*/
    // 1. Definimos los valores base según el tipo de color
    const esMonocromo = datos.tipocolor === "Monocromo";
    const tLocalBase = esMonocromo ? 360 : 240;
    const tForaneoBase = esMonocromo ? 600 : 480;
    let ubic = await ClienteUbicacion.findOne({ id: datos.ubicacion });
    datos.trEstimado = ubic.local ? tLocalBase : tForaneoBase;
    let trPoliza = 0;
    if (ubic.oficinaAtencion === null) {
      datos.localPoliza = ubic.localPoliza ? tLocalBase : tForaneoBase;
    }
    const seriesExistentes = await Equipos.find({
      numeroserie: datos.numeroserie,
    })
      .populate("articulo")
      .populate("oficina")
      .populate("ubicacion");

    if (seriesExistentes.length > 0) {
      if (seriesExistentes[0].activo == 1 && seriesExistentes[0].baja == true) {
        res
          .status(200)
          .send({
            equipo,
            resp: 0,
            mensaje: `La serie ya esta dada de alta como un equipo en la oficina:${seriesExistentes[0].oficina.nombre} y el artículo: ${seriesExistentes[0].articulo.codigo}, por favor, revisa que la serie este correcta o revisar con el administrador del sistema porque aparece una serie que ya no esta en existencia`,
          });
      } else {
        datos.activo = 1;
        datos.fechadevolucion = "";
        datos.fechabaja = "";
        datos.baja = false;
        await Equipos.updateOne({ id: seriesExistentes[0].id }).set(datos);
        equipo = await Equipos.findOne({ id: seriesExistentes[0].id })
          .populate("articulo")
          .populate("ubicacion");
      }
    } else {
      let eq = await Equipos.create(datos).fetch();
      equipo = await Equipos.findOne({ id: eq.id })
        .populate("articulo")
        .populate("ubicacion");
    }

    if (equipo) {
      let mov = {
        tipo: "USO_INTERNO",
        cantidad: 1,
        costoAplicado: 0,
        concepto: "Salida de serie para instalar con cliente",
        series: [{ serie: datos.numeroserie }],
        fecha: datos.fechainstalacion,
        articulo: equipo.articulo.id,
        oficina: equipo.oficina,
        usuarioResponsable: req.session.usuario.id,
      };
      await Series.updateOne({ id: equipo.series }).set({
        activo: 0,
        usado: "INSTALADA",
      });
      const stockActual = await StockOficina.findOne({
        articulo: equipo.articulo.id,
        oficina: equipo.oficina,
      });
      await StockOficina.updateOne({ id: stockActual.id }).set({
        cantidad: stockActual.cantidad - 1,
      });
      await MovimientoInventario.create(mov);
      res.status(200).send({ equipo, resp: 1 });
    } else {
      res.status(200).send({ equipo, resp: 0 });
    }
  },
  devolver: async function (req, res) {
    const equipo = await Equipos.findOne({ id: req.query.id });
    let mov = {
      tipo: "DEVOLUCION",
      cantidad: 1,
      costoAplicado: 0,
      concepto: "Entrada de serie por devolución",
      series: [{ serie: equipo.numeroserie }],
      fecha: new Date(),
      articulo: equipo.articulo,
      oficina: equipo.oficina,
      usuarioResponsable: req.session.usuario.id,
    };
    let existe = await EquipoLecturas.find({ equipo: equipo.id });
    if (existe.length == 0) {
      await Series.updateOne({ id: equipo.series }).set({
        activo: 1,
        usado: "DISPONIBLE",
      });
      const stockActual = await StockOficina.findOne({
        articulo: equipo.articulo,
        oficina: equipo.oficina,
      });
      await StockOficina.updateOne({ id: stockActual.id }).set({
        cantidad: stockActual.cantidad + 1,
      });
      await MovimientoInventario.create(mov);
      await Equipos.updateOne({ id: equipo.id }).set({
        baja: true,
        fechadevolucion: new Date(),
        activo: 0,
      });
      res.status(200).send({ equipo, resp: 1 });
    } else {
      res
        .status(200)
        .send({
          equipo,
          resp: 0,
          mensaje: `No se puede devolver a almacén, porque existe una toma de lectura con este equipo, por favor, primero elimina el equipo de la toma de lectura para después devolver el equipo al almacén`,
        });
    }
  },
  obtenerEquipo: async function (req, res) {
    const data = await Equipos.findOne({ id: req.query.id });

    if (data) {
      res.status(200).send({ data, resp: 1 });
    } else {
      res.status(200).send({ data, resp: 0 });
    }
  },
  actualizarDesdeCliente: async function (req, res) {
    let datos = {
      sitio: req.body.sitioE,
      ubicacion: req.body.equipoubicacionE,
      notas: req.body.notasE,
      fechainstalacion: req.body.fechainstalacionE,
      tamano: req.body.tamanoE,
      tipocolor: req.body.tipocolorE,
      tipoequipo: req.body.tipoequipoE,
      plantillas: req.body.plantillasE,
    };
    await Equipos.updateOne({ id: req.body.equipoId }).set(datos);
    let equipo = await Equipos.findOne({ id: req.body.equipoId })
      .populate("articulo")
      .populate("ubicacion");
    res.status(200).send({ equipo, resp: 1 });
  },
  actualizarDesdeEquipo: async function (req, res) {
    let datos = {
      marca: req.body.marca,
      modelo: req.body.modelo,
      descripcion: req.body.descripcion,
      sitio: req.body.sitio,
      ubicacion: req.body.ubicacionEquipo,
      notas: req.body.notas,
      fechainstalacion: req.body.fechainstalacion,
      tamano: req.body.tamano,
      tipocolor: req.body.tipocolor,
      tipoequipo: req.body.tipoequipo,
      plantillas: req.body.plantillas,
    };
    await Equipos.updateOne({ id: req.body.equipoId }).set(datos);
    let equipo = await Equipos.findOne({ id: req.body.equipoId })
      .populate("articulo")
      .populate("ubicacion");
    res.status(200).send({ equipo, resp: 1 });
  },
  baja: async function (req, res) {
    let datos = {
      fechabaja: req.body.fechabaja,
      motivobaja: req.body.motivobaja,
      baja: true,
    };
    await Equipos.updateOne({ id: req.body.equipoId }).set(datos);
    let equipo = await Equipos.findOne({ id: req.body.equipoId })
      .populate("articulo")
      .populate("ubicacion");
    res.status(200).send({ equipo, resp: 1 });
  },
  activar: async function (req, res) {
    let datos = {
      fechabaja: "",
      motivobaja: "",
      baja: false,
    };
    await Equipos.updateOne({ id: req.params.id }).set(datos);
    req.addFlash("mensaje", `Se ha activado el equipo correctamente`);
    return res.redirect(`/equipos/${req.params.id}`);
  },
  buscarClientes: async function (req, res) {
    const oficinaId = req.oficinaElegida.id;
    const ubicacionesAtendidas = await ClienteUbicacion.find({
      oficinaAtencion: oficinaId,
      activo: 1,
    });
    const idsClientesForaneos = _.map(ubicacionesAtendidas, "cliente");

    let clientes = await Clientes.find({
      where: {
        razonsocial: { contains: req.query.cliente },
        activo: 1,
        or: [{ oficina: oficinaId }, { id: idsClientesForaneos }],
      },
      limit: 5,
      sort: "razonsocial ASC",
    })
      .populate("oficina")
      .populate("ubicaciones", {
        where: { oficinaAtencion: oficinaId, activo: 1 },
      });

    if (clientes) {
      res.status(200).send({ clientes, resp: 1 });
    } else {
      res.status(400).send({ error: "No se ha encontrado ningun cliente" });
    }
  },
  buscarUbicaciones: async function (req, res) {
    let ub = await ClienteUbicacion.find({
      activo: 1,
      cliente: req.query.cliente,
    });
    let ubicaciones;
    if (req.query.oficina != req.oficinaElegida.id) {
      ubicaciones = ub.filter((e) => {
        const ubicacionActiva = e.oficinaAtencion === req.oficinaElegida.id;
        return ubicacionActiva;
      });
    } else {
      ubicaciones = ub;
    }
    if (ubicaciones) {
      res.status(200).send({ ubicaciones, resp: 1 });
    } else {
      res.status(400).send({ error: "No se ha encontrado ninguna ubicación" });
    }
  },
  historicoContadores:async function(req,res){
    console.log("Datos: ",req.query)
    let contadores=await IntervencionContadores.find({equipo:req.query.equipo,tipoContador:req.query.contador}).populate('cliente').populate('ubicacion').populate('intervencion').populate('aviso').populate('tipoContador').populate('atendidoPor')
    //console.log('contadores:',contadores)
    res.status(200).send({ contadores });
  }
};
