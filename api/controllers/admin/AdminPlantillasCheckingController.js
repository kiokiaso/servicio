module.exports = {
  index: async function (req, res) {
    let plantillas = await Plantillas.find({activo:1}).populate('tipoAvisos');
    let tipoAvisos = await TipoAvisos.find({activo:1})
    return res.view("pages/sistema/plantillas/checking", {
      plantillas,tipoAvisos
    });
  },
  crear: async function (req, res) {
    let datos=req.body;//nombre,tipoAvisos
    let plantillas=await Plantillas.create(datos).fetch();
    return res.redirect(`/admin/maestros/plantillas/${plantillas.id}`);
  },
  actualizar:async function(req,res){
     await Plantillas.update({id:req.body.idPlantilla},{
      nombre: req.body.nombreEditar,
      tipoAvisos: req.body.tipoAvisosEditar,
    });
    return res.redirect("/admin/maestros/plantillas");
  },
  eliminar:async function (req,res){
    //console.log(req.params)
    await Plantillas.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/puestos");
  },
  activar:async function (req,res){
    await Plantillas.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/puestos");
  },
  obtener:async function(req,res){
    let data = await Plantillas.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la plantilla" });
    }
  },
  //CAMPOS
  editarIndex: async function (req, res) {
    let plantillas = await Plantillas.findOne({id:req.params.id}).populate('campos');
    let campos=await CamposPlantilla.find({activo:1,plantillas:req.params.id}).sort('orden ASC')
    
    return res.view("pages/sistema/plantillas/campos", {
      plantillas,campos
    });
  },
  crearCampo: async function (req, res) {
    let datos=req.body;//plantillas,max,min,orden,tipo,nombre,{si tipo es valores, tomar min y max, si es check no tomarlos }
    if(req.body.tipo=="opciones"){
      datos.max=0;
      datos.min=0;
    }
    let plantillas=await CamposPlantilla.create(datos).fetch();
    return res.redirect(`/admin/maestros/plantillas/${plantillas.plantillas}`);
  },
  actualizarCampo:async function(req,res){
    let campo=await CamposPlantilla.findOne({id:req.body.idCampo})
    await CamposPlantilla.update({id:req.body.idCampo},{
      nombre: req.body.nombreEditar,
      orden:req.body.ordenEditar,
      tipo:req.body.tipoEditar,
      max:req.body.maxEditar,
      min:req.body.minEditar
    });
    return res.redirect(`/admin/maestros/plantillas/${campo.plantillas}`);
  },
  eliminarCampo:async function (req,res){
    //console.log(req.params)
    let campo=await CamposPlantilla.findOne({id:req.params.id})
    await CamposPlantilla.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect(`/admin/maestros/plantillas/${campo.plantillas}`);
  },
  activarCampo:async function (req,res){
    let campo=await CamposPlantilla.findOne({id:req.params.id})
    await CamposPlantilla.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect(`/admin/maestros/plantillas/${campo.plantillas}`);
  },
  obtenerCampo:async function(req,res){
    let data = await CamposPlantilla.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el campo de la plantilla" });
    }
  },
};