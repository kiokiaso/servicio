module.exports = {
  index: async function (req, res) {
    let puestos = await Puestos.find();

    return res.view("pages/sistema/puestos/puestos", {
      puestos,
    });
  },
  crear: async function (req, res) {
    await Puestos.create({
      nombre: req.body.nombre,
    });
    return res.redirect("/admin/puestos");
  },
  actualizar:async function(req,res){
     await Puestos.update({id:req.body.idPuesto},{
      nombre: req.body.nombreEditar,
    });
    return res.redirect("/admin/puestos");
  },
  eliminar:async function (req,res){
    //console.log(req.params)
    await Puestos.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/puestos");
  },
  activar:async function (req,res){
    await Puestos.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/puestos");
  },
  obtener:async function(req,res){
    let data = await Puestos.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el Puesto" });
    }
  },
};