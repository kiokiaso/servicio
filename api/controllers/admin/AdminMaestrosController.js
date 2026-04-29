module.exports = {
  index: async function (req, res) {
    let prioridades = await Prioridad.find({activo:1});
    let tiposContacto = await TipoContacto.find({activo:1});
    let tiposIntervencion = await TipoIntervencion.find({activo:1});
    let tiposContrato = await TipoContrato.find({activo:1});
    let tiposAvisos = await TipoAvisos.find({activo:1}).populate('problemas').populate('contadores');
    let tipoProblemas = await TipoProblemas.find({activo:1}).populate('tipoAvisos');
    let tipoContadores = await TipoContadores.find({activo:1}).populate('tipoAvisos');
    //console.log("tipoAvisosProblemas")
    //console.log(tiposAvisos[2].problemas)
    //console.log("tipoAvisosContadores")
    //console.log(tiposAvisos[0].contadores)

    return res.view("pages/sistema/configuracion/maestros", {
      prioridades,tiposContacto,tiposIntervencion,tiposContrato,tiposAvisos,tipoContadores,tipoProblemas
    });
  },
  //PRIORIDAD
  crearPrioridad: async function (req, res) {
    await Prioridad.create({
      nombre: req.body.nombre,
      color: req.body.color,
    });
    return res.redirect("/admin/maestros");
  },
  actualizarPrioridad:async function(req,res){
     await Prioridad.update({id:req.body.idPrioridad},{
      nombre: req.body.nombreEditar,
      color: req.body.colorEditar,
    });
    return res.redirect("/admin/maestros");
  },
  eliminarPrioridad:async function (req,res){
    //console.log(req.params)
    await Prioridad.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarPrioridad:async function (req,res){
    await Prioridad.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerPrioridad:async function(req,res){
    let data = await Prioridad.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la prioridad" });
    }
  },
  //TIPOS DE CONTACTOS
  crearTipoContacto: async function (req, res) {
    await TipoContacto.create({
      nombre: req.body.nombre,
    });
    return res.redirect("/admin/maestros");
  },
  actualizarTipoContacto:async function(req,res){
     await TipoContacto.update({id:req.body.idTipoContacto},{
      nombre: req.body.nombreEditarTC,
    });
    return res.redirect("/admin/maestros");
  },
  eliminarTipoContacto:async function (req,res){
    await TipoContacto.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarTipoContacto:async function (req,res){
    await TipoContacto.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerTipoContacto:async function(req,res){
    let data = await TipoContacto.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la prioridad" });
    }
  },
  //TIPOS DE INTERVENCION
  crearTipoIntervencion: async function (req, res) {
    await TipoIntervencion.create({
      nombre: req.body.nombre,
    });
    return res.redirect("/admin/maestros");
  },
  actualizarTipoIntervencion:async function(req,res){
     await TipoIntervencion.update({id:req.body.idTipoIntervencion},{
      nombre: req.body.nombreEditarTI,
    });
    return res.redirect("/admin/maestros");
  },
  eliminarTipoIntervencion:async function (req,res){
    await TipoIntervencion.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarTipoIntervencion:async function (req,res){
    await TipoIntervencion.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerTipoIntervencion:async function(req,res){
    let data = await TipoIntervencion.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el tipo de intervención" });
    }
  },
  //TIPOS DE CONTRATOS
  crearTipoContrato: async function (req, res) {
    await TipoContrato.create({
      nombre: req.body.nombre,
    });
    return res.redirect("/admin/maestros");
  },
  actualizarTipoContrato:async function(req,res){
     await TipoContrato.update({id:req.body.idTipoContrato},{
      nombre: req.body.nombreEditarTCont,
    });
    return res.redirect("/admin/maestros");
  },
  eliminarTipoContrato:async function (req,res){
    await TipoContrato.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarTipoContrato:async function (req,res){
    await TipoContrato.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerTipoContrato:async function(req,res){
    let data = await TipoContrato.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el tipo de contrato" });
    }
  },
  //TIPO DE AVISOS
  crearAvisos: async function (req, res) {
    let datos=req.body
    datos.troficinas=datos.troficinas==='on'?true:false
    await TipoAvisos.create(datos);
    return res.redirect("/admin/maestros");
  },
  actualizarAvisos:async function(req,res){
    let troficinas=req.body.troficinasEditar==='on'?true:false
    await TipoAvisos.update({id:req.body.idAvisos},{
        nombre:req.body.nombreEditarAvisos,
        troficinas:troficinas
    });
    return res.redirect("/admin/maestros");
  },
  eliminarAvisos:async function (req,res){
    //console.log(req.params)
    await TipoAvisos.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarAvisos:async function (req,res){
    await TipoAvisos.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerAvisos:async function(req,res){
    let data = await TipoAvisos.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la prioridad" });
    }
  },

  //TIPO DE PROBLEMAS
  crearTipoProblemas: async function (req, res) {
    let datos=req.body
    await TipoProblemas.create(datos);
    return res.redirect("/admin/maestros");
  },
  actualizarTipoProblemas:async function(req,res){
    await TipoProblemas.update({id:req.body.idTipoProblema},{
        nombre:req.body.nombreEditarTP,
        duracion:req.body.duracionEditarTP,
        tipoAvisos:req.body.tipoAvisoEditarTP
    });
    return res.redirect("/admin/maestros");
  },
  eliminarTipoProblemas:async function (req,res){
    //console.log(req.params)
    await TipoProblemas.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarTipoProblemas:async function (req,res){
    await TipoProblemas.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerTipoProblemas:async function(req,res){
    let data = await TipoProblemas.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la prioridad" });
    }
  },
  //TIPO DE CONTADORES
  crearTipoContadores: async function (req, res) {
    let datos=req.body
    await TipoContadores.create(datos);
    return res.redirect("/admin/maestros");
  },
  actualizarTipoContadores:async function(req,res){
    await TipoContadores.update({id:req.body.idTipoContadores},{
        nombre:req.body.nombreEditarTCO,
        tipocontador:req.body.tipocontadorTCO,
        tipoAvisos:req.body.tipoAvisoEditarTCO,
        variable:req.body.variableTCO
    });
    return res.redirect("/admin/maestros");
  },
  eliminarTipoContadores:async function (req,res){
    //console.log(req.params)
    await TipoContadores.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/maestros");
  },
  activarTipoContadores:async function (req,res){
    await TipoContadores.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/maestros");
  },
  obtenerTipoContadores:async function(req,res){
    let data = await TipoContadores.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la prioridad" });
    }
  },
};