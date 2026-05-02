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
    let contrasena=req.body.password
    let passwordHash = await bcrypt.hash(datos.password, 10);
    datos.password=passwordHash
    let usuario = await User.create(datos).fetch();
    let ofi=usuario.oficinas;
    await User.replaceCollection(usuario.id,'accesooficinas').members(ofi)
    contenido = `
<html>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
      <tr>
        <td align="center">

          <!-- Contenedor principal -->
          <table width="600" cellpadding="0" cellspacing="0" 
                 style="background:#ffffff; border-radius:10px; overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#0d6efd; color:#ffffff; padding:20px; text-align:center;">
                <h2 style="margin:0;">Sistema de Servicio EXI</h2>
              </td>
            </tr>

            <!-- Contenido -->
            <tr>
              <td style="padding:30px; color:#333333;">

                <h3 style="margin-top:0;">Buen día, ${req.body.nombre}</h3>

                <p style="font-size:15px; line-height:1.6;">
                  Se ha creado tu acceso al sistema de servicio. A continuación tus credenciales:
                </p>

                <table width="100%" cellpadding="8" style="background:#f9f9f9; border-radius:8px; margin-top:20px;">
                  <tr>
                    <td><strong>Ruta del sistema:</strong></td>
                    <td><a href="https://servicio.exi.com.mx" target="_blank">https://servicio.exi.com.mx</a></td>
                  </tr>
                  <tr>
                    <td><strong>Usuario:</strong></td>
                    <td>${req.body.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Contraseña:</strong></td>
                    <td>${contrasena}</td>
                  </tr>
                </table>

                <p style="margin-top:25px; font-size:13px; color:#777;">
                  Te recomendamos cambiar tu contraseña al iniciar sesión por primera vez.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f1f1f1; text-align:center; padding:15px; font-size:12px; color:#888;">
                Este es un mensaje automático generado por el Sistema de Servicio Técnico de <strong>Grupo Exi</strong>.<br>
            © <%= new Date().getFullYear() %> Todos los derechos reservados.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
`;
            var mailer = await sails.helpers.notificar.with({ contenido: contenido,correos:req.body.email, subject: 'Accesos a sistema de servicio', usuarioId: req.session.usuario.id });
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

