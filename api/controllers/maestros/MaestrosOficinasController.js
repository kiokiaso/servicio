module.exports = {
    
  //Autos
  indexAutos: async function (req, res) {
    let autos = await Autos.find({activo:1,oficina:req.oficinaElegida.id});
    //console.log("tipoAvisosProblemas")
    //console.log(tiposAvisos[2].problemas)
    //console.log("tipoAvisosContadores")
    //console.log(tiposAvisos[0].contadores)
    return res.view("pages/maestros/autos", {
      autos
    });
  },
  crearAutos: async function (req, res) {
    let datos=req.body
    datos.oficina=req.oficinaElegida.id;
    await Autos.create(datos);
    return res.redirect("/maestros/autos");
  },
  actualizarAutos:async function(req,res){
     await Autos.update({id:req.body.idAuto},{
      placa:req.body.placaEditar,
      descripcion:req.body.descripcionEditar,
      kilometraje:req.body.kilometrajeEditar
    });
    return res.redirect("/maestros/autos");
  },
  eliminarAutos:async function (req,res){
    //console.log(req.params)
    await Autos.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/maestros/autos");
  },
  activarAutos:async function (req,res){
    await Autos.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/maestros/autos");
  },
  obtenerAutos:async function(req,res){
    let data = await Autos.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el auto" });
    }
  },
  //Rutas
  indexRutas: async function (req, res) {
    let rutas = await Rutas.find({activo:1,oficina:req.oficinaElegida.id}).populate('usuario');
    let oficinas=await Oficinas.findOne({id:req.oficinaElegida.id}).populate('user',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
    return res.view("pages/maestros/rutas", {
      rutas,usuarios:oficinas.user
    });
  },
  crearRutas: async function (req, res) {
    let datos=req.body
    datos.oficina=req.oficinaElegida.id;
    await Rutas.create(datos);
    return res.redirect("/maestros/rutas");
  },
  actualizarRutas:async function(req,res){
    await Rutas.update({id:req.body.idRuta},{
      codigo:req.body.codigoEditar,
      descripcion:req.body.descripcionEditar,
      nombre:req.body.nombreEditar,
      usuario:req.body.usuarioEditar
    });
    return res.redirect("/maestros/rutas");
  },
  eliminarRutas:async function (req,res){
    //console.log(req.params)
    await Rutas.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/maestros/rutas");
  },
  activarRutas:async function (req,res){
    await Rutas.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/maestros/rutas");
  },
  obtenerRutas:async function(req,res){
    let data = await Rutas.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la ruta" });
    }
  },
};