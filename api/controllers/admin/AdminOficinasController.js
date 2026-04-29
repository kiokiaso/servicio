module.exports = {
  index: async function (req, res) {
    let oficinas = await Oficinas.find();

    return res.view("pages/sistema/oficinas/oficinas", {
      oficinas,
    });
  },
  mostrarOficina: async function (req, res) {
    let oficina = await Oficinas.findOne(req.params.id);

    return res.view("pages/sistema/oficinas/veroficinas", {
      oficina,
    });
  },
  crear: async function (req, res) {
    const datos=req.body
    let oficina=await Oficinas.create(datos).fetch();
    req.addFlash('mensaje', `La oficina ${oficina.nombre} ha sido creada`);
    return res.redirect("/admin/oficinas");
  },
  actualizar:async function(req,res){
    //console.log(req.body)
    let datos=req.body
    let id=req.body.idOficina
    delete datos.idOficina;
    await Oficinas.update({id:id},datos);
    req.addFlash('mensaje', "Los datos de la oficina han sido actualizados");
    return res.redirect(`/admin/oficinas/${id}`);
  },
  eliminar:async function (req,res){
    //console.log(req.params)
    await Oficinas.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/oficinas");
  },
  activar:async function (req,res){
    await Oficinas.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/oficinas");
  },
  obtener:async function(req,res){
    let data = await Oficinas.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado la oficina" });
    }
  },
};