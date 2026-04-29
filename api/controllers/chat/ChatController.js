module.exports = {
  // Suscribir al usuario al entrar al sistema
  conectar: async function(req, res) {
    if (!req.isSocket) return res.badRequest();
    // 1. Verificamos si existe la sesión antes de usarla
    if (!req.session || !req.session.usuario) {
        return res.unauthorized();
    }
    const userId = req.session.usuario.id;
    const socketId=sails.sockets.getId(req) 

    const user = await User.findOne({ id: userId });
    const nuevasConexiones = (user.activeConnections || 0) + 1;
    // Actualizar estado y guardar Socket ID
    await User.updateOne({ id: userId }).set({ 
      online: true, 
      socketId: sails.sockets.getId(req),
      lastSessionId:req.sessionID,
      activeConnections:nuevasConexiones
    });

    sails.sockets.join(req, 'user_' + userId);
    // Notificar a todos que un usuario entró
    if (nuevasConexiones === 1) {
      sails.sockets.blast('usuario_conectado', {
        id: userId,
        nombre: req.session.usuario.nombre,
        online:true
      });
    }
    req.session.save = function(done) { if(done) done(); }; 
    return res.ok();
  },

  enviarMensaje: async function(req, res) {
    const { para, texto } = req.allParams();
    const de = req.session.usuario.id;
    const nombreDe = req.session.usuario.nombre; // Obtenemos el nombre de la sesión

    const nuevoMensaje = await ChatMessage.create({ de, para, texto }).fetch();
    
    const destinatario = await User.findOne({ id: para });
    
    if (destinatario && destinatario.socketId) {
      sails.sockets.broadcast(destinatario.socketId, 'nuevo_mensaje', {
        de: de,
        nombreDe: nombreDe, // <--- Enviamos el nombre para que el otro sepa quién es
        texto: texto,
        createdAt: nuevoMensaje.createdAt
      });
    }

    return res.json(nuevoMensaje);
  },

  cargarHistorial: async function(req, res) {
    console.log(req.params,"chat iniciado")
        try {
        // 1. Obtener el ID del destinatario desde los parámetros de la URL
        const conId = req.params.id;
        const miId = req.session.usuario.id;

        // 2. Validación de seguridad: Verificar que el ID del contacto existe
        if (!conId) {
        // Esto devuelve un jwr con statusCode 400
            return res.badRequest({ message: 'ID de contacto no proporcionado' });
        }

        // 3. Consultar la base de datos
        // Buscamos mensajes enviados por mí al contacto O enviados por el contacto a mí
        const mensajes = await ChatMessage.find({
        or: [
            { de: miId, para: conId },
            { de: conId, para: miId }
        ]
        }).sort('createdAt ASC');

        // 4. Responder con éxito
        // Esto genera un jwr con statusCode 200 y el array (incluso si está vacío [])
        return res.json(mensajes);

    } catch (err) {
        // Esto genera un jwr con statusCode 500
        sails.log.error('Error en historial chat:', err);
        return res.serverError({ message: 'Error interno al cargar mensajes' });
    }
  },
  listaConectados: async function (req, res) {
    try {
      // 1. Buscamos todos los usuarios activos excepto yo
      // Puedes filtrar por oficina si quieres que solo vean a sus compañeros
      let usuarios = await User.find({
        id: { '!=': req.user.id },
        activo: 1, // Asegúrate de que solo usuarios activos aparezcan
        online:true
      })
      .sort('online DESC') // Los conectados aparecerán al principio de la lista
      .sort('nombre ASC');
      //console.log("usuarios conectados: ",usuarios)
      // 2. Respondemos con el array de usuarios
      return res.json(usuarios);
      
    } catch (err) {
      return res.serverError(err);
    }
  },

};
