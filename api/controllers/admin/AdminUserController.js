/**
CRUD básico de usuarios
*/
const bcrypt = require('bcryptjs');
module.exports = {
  index: async function (req, res) {
    let usuarios = await User.find().populate('roles').populate('oficinas').populate('puestos');
    let puestos=await Puestos.find({activo:1});
    let oficinas=await Oficinas.find({activo:1})
    let roles=await Role.find({activo:1})

    return res.view("pages/sistema/usuarios/usuarios", {
      roles,usuarios,puestos,oficinas
    });
  },
  crear: async function (req, res) {
    let datos=req.body
    let passwordHash = await bcrypt.hash(datos.password, 10);
    datos.password=passwordHash
    let usuario = await User.create(datos).fetch();
    let ofi=usuario.oficinas;
    await User.replaceCollection(usuario.id,'accesooficinas').members(ofi)
    return res.redirect("/admin/usuarios");
  },
  actualizar:async function(req,res){
    console.log(req.body)
    let datos={
      nombre: req.body.nombreUsuario,
      iniciales: req.body.inicialesUsuario,
      email:req.body.emailUsuario,
      oficinas:req.body.oficinasUsuario,
      roles:req.body.rolesUsuario,
      puestos:req.body.puestosUsuario,
      color:req.body.colorUsuario
    };
    if(req.body.passwordUsuario!=""){
      let passwordHash = await bcrypt.hash(req.body.passwordUsuario, 10);
      datos.password=passwordHash;
      /*bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(contrasena, salt, async function(err, hash){
          await Usuario.update({id:req.body.idUsuario},{contrasena:hash});
        });
      });*/
    }
    await User.update({id:req.body.idUsuario},datos);
    return res.redirect("/admin/usuarios");
  },
  eliminar:async function (req,res){
    console.log(req.params)
    await User.update({id:req.params.id},{
      activo: 0
    });
    return res.redirect("/admin/usuarios");
  },
  activar:async function (req,res){
    await User.update({id:req.params.id},{
      activo: 1
    });
    return res.redirect("/admin/usuarios");
  },
  obtener:async function(req,res){
    let data = await User.findOne({ id: req.query.id });
    if (data) {
      res.status(200).send({ data });
    } else {
      res.status(400).send({ error: "No se ha encontrado el contacto" });
    }
  },
  sucursales:async function(req,res){
    let usuario=await User.findOne({id:req.params.id}).populate('accesooficinas');
    let oficinasTmp=await Oficinas.find({activo:1})
    const idOficinas=new Set(usuario.accesooficinas.map(p=>p.id))
    const oficinas=oficinasTmp.map(u=>{
        return{
            ... u,
            checked:idOficinas.has(u.id)?'checked':''
        }        
    })
    return res.view("pages/sistema/usuarios/sucursales", {
      usuario,oficinas
    });
  },
  guardarSucursales:async function(req,res){
    //console.log(req.body)
    const usuarioId=req.body.idUsuario;
    const nuevasSucursales=req.body.oficinas||[];
    try {
        await User.replaceCollection(usuarioId,'accesooficinas').members(nuevasSucursales)
    } catch (error) {
        return res.serverError(err)
    }
     req.addFlash('mensaje', "Sucursales asignadas");
    return res.redirect(`/admin/usuarios/sucursales/${usuarioId}`);
  },
};

