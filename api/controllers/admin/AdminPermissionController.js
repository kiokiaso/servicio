module.exports = {
  index: async function (req, res) {
    let permisos = await Permission.find();

    return res.view("pages/sistema/permisos/permisos", {
      permisos,
    });
  },
  crear: async function (req, res) {
    await Permission.create({
      nombre: req.body.nombre,
      ruta: req.body.ruta,
      metodo:req.body.metodo
    });
    return res.redirect("/admin/permisos");
  },
  actualizar:async function(req,res){
     await Permission.update({id:req.body.idPermiso},{
      nombre: req.body.nombreEditar,
      ruta: req.body.rutaEditar,
      metodo:req.body.metodoEditar
    });
    return res.redirect("/admin/permisos");
  },
  eliminar:async function (req,res){
    console.log(req.params)
    await Permission.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/permisos");
  },
  activar:async function (req,res){
    await Permission.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/permisos");
  },
  obtener:async function(req,res){
    let data = await Permission.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el contacto" });
    }
  },
};