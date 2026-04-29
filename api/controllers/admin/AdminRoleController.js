module.exports = {
  index: async function (req, res) {
    let roles = await Role.find();

    return res.view("pages/sistema/roles/roles", {
      roles,
    });
  },
  crear: async function (req, res) {
    await Role.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
    });
    return res.redirect("/admin/roles");
  },
  actualizar:async function(req,res){
    console.log(req.body)
     await Role.update({id:req.body.idRole},{
      nombre: req.body.nombreEditar,
      descripcion: req.body.descripcionEditar,
    });
    return res.redirect("/admin/roles");
  },
  eliminar:async function (req,res){
    console.log(req.params)
    await Role.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/roles");
  },
  activar:async function (req,res){
    await Role.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/roles");
  },
  obtener:async function(req,res){
    let data = await Role.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el contacto" });
    }
  },
  permisos:async function(req,res){
    let role=await Role.findOne({id:req.params.id}).populate('permisos');
    let permisoTmp=await Permission.find({activo:1})
    const idPermiso=new Set(role.permisos.map(p=>p.id))
    const permisos=permisoTmp.map(u=>{
        return{
            ... u,
            checked:idPermiso.has(u.id)?'checked':''
        }        
    })
    return res.view("pages/sistema/roles/permisos", {
      role,permisos
    });
  },
  guardarPermisos:async function(req,res){
    const roleId=req.body.idRole;
    const nuevosPermisos=req.body.permiso||[];
    console.log(nuevosPermisos)
    try {
        await Role.replaceCollection(roleId,'permisos').members(nuevosPermisos)
    } catch (error) {
        return res.serverError(err)
    }
     req.addFlash('mensaje', "Permisos de rol actualizados");
    return res.redirect(`/admin/roles/permisos/${roleId}`);
  },
};