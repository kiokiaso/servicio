/**
Controlador de autenticación
*/
const passport = require('../services/PassportService');
const parser = require('ua-parser-js');
//const passport = require("passport");

module.exports = {
     inicio:function(req,res){
        res.view("pages/login",{layout:'layouts/users',title:"Inicio de sesión",_csrf: ''/*req.csrfToken()*/});
    },
  nonAuthorization:async function(req,res){
    res.view("pages/errors/non-authorization",{ruta:req.query.ruta,metodo:req.query.metodo})
  },
  login:async function (req, res) {
    passport.authenticate("local",async function (err, user, info) {
      if (err) {
        return res.serverError("Problema");
      }

      if (!user) {
        req.addFlash('mensaje', info.message);
         return res.redirect('/login');
      }

      const userFull = await User.findOne({ id: user.id }).populate('roles');
      // Validar si ya tiene sesión activa
        //sails.log.info("Entrando")
        //console.log(userFull)
      if (userFull.isLoggedIn=='true' && userFull.lastSessionId !== req.sessionID) {
      //if (userFull.activeConnections>0 && userFull.lastSessionId !== req.sessionID) {
        sails.log.info("Entrando")
        console.log(userFull)
        req.addFlash('mensaje', 'Ya tienes una sesión activa en otro dispositivo o navegador, o bien, tu cierre de sesión no fue el correcto y quedo tu sesión activa, por favor, contacta al administrador para que te restablezca las sesiones activas y ya puedas ingresar');
        return res.redirect('/login');
      }
      const ua = parser(req.headers['user-agent']);
      req.session.regenerate(function () {
        req.logIn(user, async function (err) {
          if (err) {
            return res.serverError(err);
          }
            const roleIds = userFull.roles.id;
            const rolesConPermisos = await Role.find({ id: roleIds }).populate('permisos');
            const sessionUser = _.omit(userFull, ['password', 'createdAt', 'updatedAt']);
            req.session.usuario = sessionUser;
            let of=await Oficinas.findOne({id:userFull.oficinas});
            req.session.permisos = rolesConPermisos.flatMap(rol => rol.permisos)
            console.log(req.session.usuario.roles.nombre)
            return req.session.save(async (err) => {
              if (err) return res.serverError(err);
              req.sessionID=req.sessionID
              try{
                await User.updateOne({ id: userFull.id }).set({
                  deviceIp: req.ip,
                  deviceInfo: {
                    browser: ua.browser.name,
                    os: ua.os.name,
                    device: ua.device.model || 'Desktop',
                    vendor: ua.device.vendor || 'N/A'
                  },
                  isLoggedIn: true,
                  lastSessionId: req.sessionID, 
                  oficinaActual:of.id
                });
               
                return res.redirect("/");
              }catch(err){
                return res.serverError(err);
              }
            });
        });
      });
    })(req, res);
  },
  announce: async function (req, res) {
    if (!req.isSocket) return res.badRequest();
    
    const userId = req.session.passport.user;
    if (!userId) return res.unauthorized();

    await User.updateOne({ id: userId }).set({ online: true });

    // Notificar a todos los demás
    sails.sockets.blast('user_connected', { 
      id: userId, 
      username: req.session.username // Asegúrate de guardar esto en sesión al loguear
    });

    return res.ok();
  },
  syncSocket: async function(req, res) {
    if (!req.isSocket) return res.badRequest();
    if (!req.session.usuario.id) return res.unauthorized();
    //console.log("Syncsocket")
    try {
      const user = await User.findOne({ id: req.session.usuario.id });
      //const newCount = (user.activeConnections || 0) + 1;
      await User.updateOne({ id: user.id }).set({ 
        socketId: sails.sockets.getId(req),
        online:true,
        activeConnections:1
      });
      sails.sockets.join(req, 'user_' + user.id);
      sails.sockets.blast('usuario_conectado', {
        id: user.id,
        nombre: req.session.usuario.nombre,
        online:true
      });
      return res.ok({ connections: 0 });
    } catch (err) {
      return res.serverError(err);
    }
  },
  logout:async function (req, res) {
    let userId=req.session.usuario.id 
     await User.updateOne({ id: userId}).set({
        isLoggedIn: false,
        lastSessionId: '',
        activeConnections:0,
        socketId:'',
        online:false
      });
    req.logout(function () {
      /**
       * destruir sesión
       */
      sails.sockets.blast('usuario_desconectado', { id: userId });
      sails.sockets.leaveAll('user_' + userId);
      req.session.destroy(function () {
        res.redirect("/login");
      });
    });
  },
  obtenerOficina:async function(req,res){
    let usuarios=await User.findOne({id:req.session.usuario.id}).populate('accesooficinas',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
    let oficinas=usuarios.accesooficinas;
    res.status(200).send({ oficinas });
  },
  cambiarOficina: async function(req, res) {
  try {
    const idOficina = req.body.oficinasCambiar;
    let of = await Oficinas.findOne({ id: idOficina });

    if (of) {
      // 1. Limpieza total de la referencia ant
      
      // 2. CLONAR el objeto. Esto es CRUCIAL. 
      // Si asignas 'of' directamente, Sails a veces no detecta el cambio 
      // porque internamente el objeto 'of' tiene metadatos de Waterline.
      const oficinaParaSesion = JSON.parse(JSON.stringify(of));
      

      // 3. Forzar el guardado y esperar a que termine antes de redirigir
      await new Promise((resolve,reject)=>{
        return req.session.save((err) => {
           if (err) return reject(err);
          resolve();
        });
      })
      await User.updateOne({id:req.session.usuario.id}).set({oficinaActual:of.id})

      // 5. Evitamos caché del navegador agresivamente
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Redirigimos con un parámetro de tiempo para forzar al navegador a pedir una "nueva" página
      const returnUrl = req.get("Referrer") || "/";
      const separator = returnUrl.includes('?') ? '&' : '?';
      return setTimeout(() => {
          return res.redirect(`${returnUrl}${separator}update=${Date.now()}`);
      }, 1000); 
      


    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error("Error en cambiarOficina:", err);
    return res.serverError(err);
  }
},

 
};

/*
const passport = require("passport");

module.exports = {
    inicio:function(req,res){
        res.view("pages/login",{layout:'layouts/users',title:"Inicio de sesión", _csrf: req.csrfToken()});
    },
  login: function (req, res) {
    passport.authenticate("local", function (err, user, info) {
      if (err) {
        return res.serverError(err);
      }

      if (!user) {
        return res.view("pages/login", {
          error: info.message,
        });
      }

      req.logIn(user, function (err) {
        req.session.usuario = user;

        return res.redirect("/");
      });
    })(req, res);

  },
  
  logout: function (req, res) {
    req.logout(() => {
      req.session.destroy();
      return res.redirect("/login");
    });
  },
};*/

/*const passport = require('passport');
const bcrypt = require('bcrypt');
module.exports = {
    inicio:function(req,res){
        res.view("pages/login",{layout:'layouts/users',title:"Inicio de sesión", _csrf: req.csrfToken()});
    },
    login: function (req, res) {
        console.log(req.body);
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                req.addFlash('mensaje', err.message);
                return res.redirect('/login');
            }if (!user) {
                req.addFlash('mensaje', info.message);
                return res.redirect('/login');
            }
            req.logIn(user, async function (err) {
                if (err) {res.send(err)};

                await Actividades.create({titulo:'LogIn',contenido:'Inicio de sesión',ruta:'/login',tipo:'Sesión',controlador:'AuthController',agente:'Ip:'+req.ip+' - Agente:'+req.headers['user-agent'],usuario:user.id});
                //Actividades.create({titulo:'Login',contenido:`Usuario:${req.body.email},Contraseña:****`,ruta:'/login',tipo:'Sesion',controlador:'Auth'});
                return res.redirect('/');
            });
        })(req, res);
    },
    logout: async (req, res) => {
        await Actividades.create({titulo:'LogOut',contenido:'Cierre de sesión',ruta:'/logout/',tipo:'Sesion',controlador:'AuthController',agente:'Ip:'+req.ip+' - Agente:'+req.headers['user-agent'],usuario:req.session.usuario.id});
        req.session.destroy(function(err){
            setTimeout(function(){
                return res.redirect("/login");
            },2500);
        });
        //req.logout();
        //return respuesta.redirect('/login');
    },
    register:async function (req, res) {
        //TODO: form validation here
        data = {
            nombre: req.body.nombre,
            email: req.body.email,
            contrasena: req.body.contrasena,
            role:1,
            oficina: 1
        }

        //var usuario= await Usuario.create(data).fetch();
        //console.log(usuario);
        Usuario.create(data).fetch().exec(function (err, user) {

            if (err) return res.negotiate(err);

            //TODO: Maybe send confirmation email to the user before login
            req.logIn(user, function (err) {
                console.log(data);
                if (err) return res.negotiate(err);
                sails.log('User ' + user.id + ' has logged in.');
                return res.redirect('/');
            })
        })
    },
    forgetPassword:async function(req,res){
      console.log(req.body);
      if(req.body.email==""){
        req.addFlash('mensaje', 'El correo electrónico no debe ser vacio');
        res.redirect('/forget-password');
      }
      let correo=await Usuario.count({email:req.body.email,activo:1});
      console.log(correo)
      if(correo>0){
        let usuario=await Usuario.findOne({email:req.body.email,activo:1})
        contenido=`
        <html>
          <head></head>
          <body>
            <h1>Buen día, ${usuario.nombre}</h1>
            <br>
            <p>Por este medio le informamos que se ha solicitado la recuperación de su contraseña</p>
            <p>Si no ha sido usted, por favor, ignore el correo e ingrese al sistema a cambiar su contraseña desde su perfil</p>
            <p>Si ha sido usted por favor ingrese a la siguiente página  <a href="https://ventas.exi.com.mx/recover-password/${usuario.id}">https://ventas.exi.com.mx/recover-password/${usuario.id}</a>
            </p>
            <p>Debes tener en cuenta las siguientes consideraciones:
              <ul>
                <li>Una contraseña igual o mayor a 10 caracteres</li>
                <li>Que tenga mayúsculas, minúsculas, números y caracteres especiales</li>
              </ul>
            </p>
            <p>Recuerda que tus accesos son únicos e intransferibles, por favor, cuidalos y no los compartas con nadie</p>
            <p style="color:red;">No respondas a este correo, es enviado desde una cuenta no monitoreada</p>
          </body>
        </html>`;
        var mailer = await sails.helpers.notificar.with({ contenido: contenido,correos:usuario.email, subject: 'Recuperar contraseña', tipo: 4, notificacion: 1, usuarioId: usuario.id });
        req.addFlash('mensaje', 'Se te ha enviado un correo a tu dirección de email, por favor, sigue las instrucciones dichas en el correo');
        res.redirect('/forget-password');
      }else{
        req.addFlash('mensaje', 'El correo electrónico no se ha encontrado, por favor, contactate con el administrador del sistema');
        res.redirect('/forget-password');
      }

    },
    olvidarContrasena:function(req,res){
        res.view("pages/forget-password",{layout:'layouts/users',title:"Recuperar Contraseña"});
    },
    recuperarContrasena:function(req,res){
        res.view("pages/recover-password",{layout:'layouts/users',title:"Recuperar Contraseña",usuario:req.params.id});
    },
    recoverPassword:async function(req,res){

      if(req.body.password!=""&&req.body.password.length>=10){
          bcrypt.genSalt(10, function(err, salt){
              bcrypt.hash(req.body.password, salt, async function(err, hash){
                  await Usuario.update({id:req.body.usuarioId},{contrasena:hash});
                  res.redirect('login');
              });
          });
      }
      else{
        req.addFlash('mensaje', 'La contraseña no debe ser vacia y no debe ser menor a 10 caracteres');
        res.redirect('/recover-password/'+req.body.usuarioId);
      }
    }
};
*/
