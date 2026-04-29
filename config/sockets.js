/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * Use the settings below to configure realtime functionality in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/sockets
 */
let pendingDisconnections = {}; // Objeto temporal en memoria
const pendientesOfflineold = {};
module.exports.sockets = {
  /*onlyAllowOrigins: [
    "http://localhost:1337",
    "http://127.0.0.1:1337"
  ],
  onlyAllowOrigins:false,*/
   
  /***************************************************************************
  *                                                                          *
  * `transports`                                                             *
  *                                                                          *
  * The protocols or "transports" that socket clients are permitted to       *
  * use when connecting and communicating with this Sails application.       *
  *                                                                          *
  * > Never change this here without also configuring `io.sails.transports`  *
  * > in your client-side code.  If the client and the server are not using  *
  * > the same array of transports, sockets will not work properly.          *
  * >                                                                        *
  * > For more info, see:                                                    *
  * > https://sailsjs.com/docs/reference/web-sockets/socket-client           *
  *                                                                          *
  ***************************************************************************/

  transports: [ 'websocket' ],


  /***************************************************************************
  *                                                                          *
  * `beforeConnect`                                                          *
  *                                                                          *
  * This custom beforeConnect function will be run each time BEFORE a new    *
  * socket is allowed to connect, when the initial socket.io handshake is    *
  * performed with the server.                                               *
  *                                                                          *
  * https://sailsjs.com/config/sockets#?beforeconnect                        *
  *                                                                          *
  ***************************************************************************/

  // beforeConnect: function(handshake, proceed) {
  //
  //   // `true` allows the socket to connect.
  //   // (`false` would reject the connection)
  //   return proceed(undefined, true);
  //
  // },


  /***************************************************************************
  *                                                                          *
  * `afterDisconnect`                                                        *
  *                                                                          *
  * This custom afterDisconnect function will be run each time a socket      *
  * disconnects                                                              *
  *                                                                          *
  ***************************************************************************/

  afterConnect: async function(session, socket, cb) {
    // Ajustado a tu estructura: session.usuario.id
    if (session) { session.save = function(done) { if(done) done(); }; }
    console.log("Entra al afterConnect")
    if (session && session.usuario && session.usuario.id) {
      const userId = session.usuario.id;
      try {
        if (pendientesOffline[userId]) {
          clearTimeout(pendientesOffline[userId]);
          delete pendientesOffline[userId];
        }
        const user = await User.findOne({ id: userId });
        const nuevasConexiones = (user.activeConnections || 0) + 1;
        console.log('Conexionesnuevas',nuevasConexiones)
        await User.updateOne({ id: userId }).set({
          activeConnections: nuevasConexiones,
          isOnline: true,
          socketId: socket.id 
        });
        sails.sockets.join(socket, 'user_' + userId);
        if (nuevasConexiones === 1) {
          sails.sockets.blast('usuario_conectado', {
            id: userId,
            nombre: session.usuario.nombre,
            online: true
          });
        }
      } catch (err) {
        sails.log.error('Error en afterConnect:', err);
      }
    }
    return cb();
  },

  afterDisconnect:async function(session, socket, cb) {
    if (session) { session.save = function(done) { if(done) done(); }; }
    if (session && session.usuario && session.usuario.id) {
      const userId = session.usuario.id;
      const socketIdQueSeVa = socket.id; // Guardamos cuál socket se cerró

      //sails.config.pendientesOffline[userId] = setTimeout(async () => {
        try {
          const user = await User.findOne({ id: userId });
          if (!user) return;

          // VALIDACIÓN: Si el socketId en BD es distinto al que se fue, 
          // significa que el usuario ya abrió otra pestaña. NO restamos.
          if (user.activeConnections > 0 && user.socketId === socketIdQueSeVa) {
            let conexionesRestantes = user.activeConnections - 1;
            
            await User.updateOne({ id: userId }).set({
              activeConnections: conexionesRestantes,
              online: conexionesRestantes > 0
            });

            if (conexionesRestantes === 0) {
              sails.sockets.blast('usuario_desconectado', { id: userId });
            }
          }
          delete sails.config.pendientesOffline[userId];
        } catch (err) { sails.log.error(err); }
      //}, 2000); // 3 segundos es suficiente y reduce la espera
    }
    return cb();
  },
 /*afterConnect: function(session, socket, cb) {
    // Validamos que exista el usuario en la sesión
    if (session && session.usuario && session.usuario.id) {
      const userId = session.usuario.id;

      // Unir el socket a su sala única de usuario
      sails.sockets.join(socket, 'user_' + userId);

      // Si había un temporizador de "poner offline" para este usuario, lo CANCELAMOS
      if (pendientesOffline[userId]) {
        clearTimeout(pendientesOffline[userId]);
        delete pendientesOffline[userId];
        // console.log(Usuario ${userId} regresó rápido. Cancelando desconexión.);
      }

      // Siempre asegurar que esté en true y actualizar el socketId actual
      User.updateOne({ id: userId })
        .set({ isOnline: true, socketId: socket.id,lastSessionId:req.sessionID })
        .exec((err) => {
          return cb();
        });

        sails.sockets.blast('usuario_conectado', {
          id: userId,
          nombre: req.session.usuario.nombre,
          online:true
        });
    } else {
      return cb();
    }
  },
  afterDisconnect: function(session, socket, cb) {
    if (session && session.usuario && session.usuario.id) {
      const userId = session.usuario.id;

      // Creamos un delay de 7 segundos para dar tiempo a que cargue la siguiente página
      pendientesOffline[userId] = setTimeout(async () => {
        
        // VERIFICACIÓN CRUCIAL: ¿Queda alguna otra ventana abierta?
        // Buscamos sockets en la sala de este usuario
        const socketsRestantes = sails.sockets.getFromRoom('user_' + userId);

        if (socketsRestantes.length === 0) {
          // Si ya no hay sockets, el usuario realmente cerró todo o perdió internet
          await User.updateOne({ id: userId }).set({ isOnline: false });
          // console.log(Usuario ${userId} está oficialmente OFFLINE.);
        }
        
        delete pendientesOffline[userId];
      }, 7000); 
    }
    return cb();
  },
  afterDisconnect12042026: async function(session, socket, cb) {
  const userId = session.passport ? session.passport.user : null;

  if (userId) {
    // Guardamos el ID del socket que se acaba de desconectar
    const socketIdQueSeVa = socket.id;

    setTimeout(async () => {
      // Buscamos al usuario en la BD para ver su estado actual
      const u = await User.findOne({ id: userId });

      if (!u) return;

      // VALIDACIÓN CLAVE: 
      // Si el socketId en la BD sigue siendo el mismo que se desconectó,
      // significa que NO se ha conectado desde otra pestaña o recarga.
      if (u.socketId === socketIdQueSeVa) {
        await User.updateOne({ id: userId }).set({ 
          online: false,
          socketId: '' // Limpiamos el socket ya que no es válido
        });
        
        sails.sockets.blast('usuario_desconectado', { id: userId });
        console.log(`Usuario ${u.nombre} ahora está Offline (Cerró sesión/navegador)`);
      } else {
        // Si u.socketId es diferente, significa que el usuario recargó 
        // la página y ya tiene un nuevo ID de socket activo.
        console.log(`Usuario ${u.nombre} sigue Online (Navegación detectada)`);
      }
    }, 7000); // Subimos a 7 segundos para dar margen a conexiones lentas
  }
  
  return cb();
},
  afterConnectOLD: async function(session, socket, cb) {
    console.log("Socket activo y debe sumar al usuario")
    if (session && session.usuario.id) {
      try {
        const user = await User.findOne({ id: session.usuario.id });
        const currentConnections = user.activeConnections+1;
         await User.updateOne({ id: session.usuario.id }).set({
          activeConnections: currentConnections + 1
        });
        
        console.log(`Usuario ${session.usuario.id} conectó una pestaña. Total: ${currentConnections + 1}`);
      } catch (err) {
        return cb(err);
      }
    }
    return cb();
  },

   afterDisconnectOLd: async function(session, socket, cb) {
    if (session && session.usuario.id) {
      try {
        const user = await User.findOne({ id: session.usuario.id });
        if (user) {
          // 2. Calculamos el nuevo total (nunca menor a 0)
          let newCount = Math.max(0, (user.activeConnections || 1) - 1);
          
         
          
          // 3. SOLO si es la última pestaña, cambiamos el estado a offline
         // console.log("Conexiones dentro de socket antes de cerrar sesión")
          //console.log(newCount)
          if (newCount === 0) {
            setTimeout(async () => {
              const usuario = await User.findOne({ id: session.usuario.id });
              let cont = Math.max(0, (usuario.activeConnections || 1) - 1);
              //console.log("Conexiones dentro de socket justo al cerrar sesión")
              //console.log(cont)
               let updateData = { activeConnections: cont };
              if(cont===0){
                updateData.isLoggedIn = 'false';
                updateData.lastSessionId = '';
                session.usuario.id=null;
               // console.log(`Usuario ${user.nombre} cerró todas las pestañas. Estado: OFFLINE`);
                await User.updateOne({ id: user.id }).set(updateData);
              }
              else{
                await User.updateOne({ id: user.id }).set(updateData);
              }
            }, 2000);
          } else {
            let updateData = { activeConnections: newCount };
            await User.updateOne({ id: user.id }).set(updateData);
            //console.log(`Usuario ${user.nombre} cerró una pestaña. Quedan: ${newCount}`);
          }
          
        }

      } catch (err) {
        return cb(err);
      }
    }
    return cb();
   },*/


  /***************************************************************************
  *                                                                          *
  * Whether to expose a 'GET /__getcookie' route that sets an HTTP-only      *
  * session cookie.                                                          *
  *                                                                          *
  ***************************************************************************/

  grant3rdPartyCookie: true,


};
