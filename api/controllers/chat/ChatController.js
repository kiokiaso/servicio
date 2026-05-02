const rutas={
    'GET /non-authorization':'default/AuthController.nonAuthorization',
  'GET /user/sync-socket':'default/AuthController.syncSocket',
  'GET /': 'default/DashboardController.index',
  'get /login': 'default/AuthController.Inicio',
  'post /login': 'default/AuthController.login',
  'get /logout': 'default/AuthController.logout',
  'post /forget-password': 'default/AuthController.forgetPassword',
  'post /recover-password': 'default/AuthController.recoverPassword',
  'get /forget-password': 'default/AuthController.olvidarContrasena',
  'get /recover-password/:id': 'default/AuthController.recuperarContrasena',
  'GET /config/oficinas/obtener':'default/AuthController.obtenerOficina',
  'POST /config/oficinas/cambiar':'default/AuthController.cambiarOficina',
  'GET /avisos/pendientes':'avisos/AvisosController.index',
  'GET /avisos/finalizados':'avisos/AvisosController.finalizados',
  'GET /avisos/:id':'avisos/AvisosController.ficha',
  'POST /avisos/pendientes/tabla':'avisos/AvisosController.tablaPendientes',
  'GET /avisos/crear':'avisos/AvisosController.formCrearAviso',
  'GET /avisos/equipos/buscar':'avisos/AvisosController.buscarEquipos',
  'GET /avisos/ubicaciones/buscar':'avisos/AvisosController.buscarUbicaciones',
  'GET /avisos/contactos/buscar':'avisos/AvisosController.buscarContactos',
  'GET /avisos/equipos/obtener':'avisos/AvisosController.obtenerEquipo',
  'GET /avisos/clientes/buscar':'avisos/AvisosController.buscarClientes',
  'GET /avisos/tipoproblema/buscar':'avisos/AvisosController.buscarTipoProblemas',
  'GET /avisos/equipos/form-agregar':'avisos/AvisosController.obtenerEquiposAgregar',
  'POST /avisos/crear':'avisos/AvisosController.crear',
  'GET /avisos/editar/:id':'avisos/AvisosController.formEditarAviso',
  'POST /avisos/editar':'avisos/AvisosController.editar',
  'GET /avisos/cerrar':'avisos/AvisosController.cerrar',
  'GET /avisos/reabrir':'avisos/AvisosController.reabrir',
  'GET /avisos/equipos/atender/:equipoAviso/:aviso':'avisos/AvisosController.iniciarAtencion',
  'GET /avisos/equipos/atender/:equipoAviso/:aviso/:intervencion':'avisos/AvisosController.iniciarAtencion',
  'GET /avisos/articulos/buscar': 'avisos/AvisosController.buscarArticulo',
  'POST /avisos/equipos/atender/guardar':'avisos/AvisosController.equipoAtenderGuardar',
  'GET /avisos/intervencion/finalizar/:id':'avisos/AvisosController.finalizarIntervencion',
  'GET /avisos/equipos/atender-pendiente/:equipoAviso/:aviso/:intervencion':'avisos/AvisosController.atencionPendiente',
  'POST /avisos/equipos/atender/guardar-pendiente':'avisos/AvisosController.equipoAtenderGuardarPendiente',
  'POST /avisos/contactos/crear':'avisos/AvisosController.crearContacto',
  'POST /avisos/intervencion/cerrar':'avisos/AvisosController.cerrarIntervencion',
  'POST /avisos/intervencion/material/actualizar':'avisos/AvisosController.actualizarMaterial',
  'POST /avisos/intervencion/material/eliminar':'avisos/AvisosController.eliminarMaterial',
  'POST /avisos/intervencion/contador/actualizar':'avisos/AvisosController.actualizarContador',
  'GET /avisos/descargar-pdf/:id':'avisos/AvisosController.descargarPDF',
  'GET /avisos/intervencion/editar/:id':'avisos/AvisosController.editarFormIntervencion',
  'POST /avisos/articulos/agregar':'avisos/AvisosController.agregarMateriales',
  'POST /avisos/intervencion/editar':'avisos/AvisosController.editarIntervencion',
  'POST /avisos/intervencion/plantilla/actualizar':'avisos/AvisosController.editarDatosPlantilla',
  'GET /avisos/remotos':'avisos/AvisosController.remotos',
  'GET /avisos/remotos/iniciar-atencion':'avisos/AvisosController.remotosIniciarAtencion',
  'POST /avisos/remotos/guardar':'avisos/AvisosController.remotosGuardar',
  'GET /avisos/calendario':'avisos/AvisosController.vistaCalendario',
  'GET /avisos/eventos-calendario':'avisos/AvisosController.eventosCalendario',
  'POST /avisos/validar-y-mover':'avisos/AvisosController.validarYMover',
  'POST /avisos/actualizar-estado':'avisos/AvisosController.actualizarEstado',
  'POST /avisos/modificar-programacion-manual':'avisos/AvisosController.modificarProgramacionManual',
  'GET /avisos/obtener':'avisos/AvisosController.obtener',
  'GET /lecturas':'lecturas/LecturasController.lecturas',
  'GET /lecturas/avisos':'lecturas/LecturasController.avisos',
  'POST /lecturas/avisos':'lecturas/LecturasController.filtroAvisos',
  'GET /lecturas/:id':'lecturas/LecturasController.ficha',
  'POST /lecturas/crear':'lecturas/LecturasController.crear',
  'GET /lecturas/crear/:id':'lecturas/LecturasController.completar',
  'GET /lecturas/equipos/buscar':'lecturas/LecturasController.buscarEquipos',
  'GET /lecturas/equipo/eliminar':'lecturas/LecturasController.eliminarEquipo',
  'GET /lecturas/equipo/datos':'lecturas/LecturasController.obtenerEquipos',
  'POST /lecturas/agregar-equipo':'lecturas/LecturasController.agregarEquipos',
  'POST /lecturas/actualizar':'lecturas/LecturasController.actualizarLectura',
  'POST /lecturas/asistencias/generar':'lecturas/LecturasController.generarAsistencias',
  'POST /lecturas/avisos/crear':'lecturas/LecturasController.generarAvisos',
  'GET /lecturas/asistencias/eliminar':'lecturas/LecturasController.eliminarAsistencia',
  'POST /lecturas/asistencias/actualizar':'lecturas/LecturasController.actualizarAsistencia',
  'GET /lecturas/asistencias/obtener':'lecturas/LecturasController.obtenerAsistencia',
  'POST /lecturas/asistencias/agregar':'lecturas/LecturasController.agregarAsistencia',
  'GET /equipos':'equipos/EquiposController.equipos',
  'GET /equipos/:id':'equipos/EquiposController.ficha',
  'GET /equipos/baja':'equipos/EquiposController.baja',
  'GET /equipos/clientes/buscar':'equipos/EquiposController.buscarClientes',
  'GET /equipos/clientes/buscar/ubicaciones':'equipos/EquiposController.buscarUbicaciones',
  'GET /equipos/clientes/buscar/series':'equipos/EquiposController.buscarSeries',
  'POST /equipos/actualizar':'equipos/EquiposController.actualizarDesdeEquipo',
  'POST /equipos/baja':'equipos/EquiposController.baja',
  'GET /equipos/activar/:id':'equipos/EquiposController.activar',
  'GET /equipos/bajas':'equipos/EquiposController.equiposBajas',
  'GET /equipos/contadores/historial':'equipos/EquiposController.historicoContadores',
  'GET /almacen/articulos':'almacen/ArticulosController.index',
  'GET /almacen/articulos/:id':'almacen/ArticulosController.mostrar',
  'POST /almacen/articulos/crear':'almacen/ArticulosController.crear',
  'GET /almacen/articulos/obtener':'almacen/ArticulosController.obtener',
  'GET /almacen/articulos/tabla':'almacen/ArticulosController.tabla',
  'POST /almacen/articulos/actualizar':'almacen/ArticulosController.actualizar',
  'GET /almacen/articulos/eliminar/:id':'almacen/ArticulosController.eliminar',
  'GET /almacen/articulos/activar/:id':'almacen/ArticulosController.activar',
  'POST /almacen/articulos/nuevo-movimiento':'almacen/ArticulosController.nuevoMovimiento',
  'POST /almacen/articulos/nuevo-movimiento-serie':'almacen/ArticulosController.nuevoMovimientoSerie',
  'GET /almacen/articulos/obtener/series':'almacen/ArticulosController.obtenerSeries',
  'GET /almacen/movimientos':'almacen/ArticulosController.movimientos',
  'GET /almacen/articulos/movimientos/:id':'almacen/ArticulosController.movimientos',
  'GET /almacen/movimientos/articulo/buscar':'almacen/ArticulosController.articulosMovBuscar',
  'GET /almacen/movimientos/tabla':'almacen/ArticulosController.tablaMovimientos',
  'GET /almacen/stock':'almacen/ArticulosController.stock',
  'GET /almacen/stock/tabla':'almacen/ArticulosController.tablaStock',
  'GET /almacen/transferencia':'almacen/ArticulosController.transferencia',
  'POST /almacen/transferencia':'almacen/ArticulosController.transferencia',
  'POST /almacen/transferencia/masivo':'almacen/ArticulosController.masivo',
  'GET /almacen/compras':'almacen/ArticulosController.compras',
  'GET /almacen/articulos/buscar-compras':'almacen/ArticulosController.buscarArticulos',
  'POST /almacen/compras/agregar':'almacen/ArticulosController.agregarCompra',
  'GET /clientes':'clientes/ClientesController.index',
  'GET /clientes/:id':'clientes/ClientesController.ficha',
  'POST /clientes/crear':'clientes/ClientesController.crear',
  'POST /clientes/actualizar':'clientes/ClientesController.actualizar',
  'GET /clientes/desactivar/:id':'clientes/ClientesController.desactivar',
  'POST /clientes/actualizar-coordenadas':'clientes/ClientesController.clienteCoordenadas',
  'POST /clientes/ubicacion/actualizar-coordenadas':'clientes/ClientesController.ubicacionCoordenadas',
  'POST /clientes/ubicacion/agregar':'clientes/ClientesController.agregarUbicacion',
  'GET /clientes/ubicacion/eliminar':'clientes/ClientesController.eliminarUbicacion',
  'GET /clientes/ubicacion/obtener':'clientes/ClientesController.obtenerUbicacion',
  'POST /clientes/ubicacion/actualizar':'clientes/ClientesController.actualizarUbicacion',
  'POST /clientes/contacto/agregar':'clientes/ClientesController.agregarContacto',
  'GET /clientes/contacto/eliminar':'clientes/ClientesController.eliminarContacto',
  'GET /clientes/contacto/obtener':'clientes/ClientesController.obtenerContacto',
  'POST /clientes/contacto/actualizar':'clientes/ClientesController.actualizarContacto',
  'GET /almacen/series/buscar':'almacen/ArticulosController.buscarSeries',
  'POST /clientes/equipo/agregar':'equipos/EquiposController.crearDesdeCliente',
  'GET /clientes/equipo/eliminar':'equipos/EquiposController.devolver',
  'GET /clientes/equipo/obtener':'equipos/EquiposController.obtenerEquipo',
  'POST /clientes/equipo/actualizar':'equipos/EquiposController.actualizarDesdeCliente',
  'GET /clientes/inactivos':'clientes/ClientesController.inactivos',
  'GET /clientes/activar/:id':'clientes/ClientesController.activar',
  'GET /maestros/autos':'maestros/MaestrosOficinasController.indexAutos',
  'POST /maestros/autos/crear':'maestros/MaestrosOficinasController.crearAutos',
  'GET /maestros/autos/obtener':'maestros/MaestrosOficinasController.obtenerAutos',
  'POST /maestros/autos/actualizar':'maestros/MaestrosOficinasController.actualizarAutos',
  'GET /maestros/autos/eliminar/:id':'maestros/MaestrosOficinasController.eliminarAutos',
  'GET /maestros/autos/activar/:id':'maestros/MaestrosOficinasController.activarAutos',
  'GET /maestros/rutas':'maestros/MaestrosOficinasController.indexRutas',
  'POST /maestros/rutas/crear':'maestros/MaestrosOficinasController.crearRutas',
  'GET /maestros/rutas/obtener':'maestros/MaestrosOficinasController.obtenerRutas',
  'POST /maestros/rutas/actualizar':'maestros/MaestrosOficinasController.actualizarRutas',
  'GET /maestros/rutas/eliminar/:id':'maestros/MaestrosOficinasController.eliminarRutas',
  'GET /maestros/rutas/activar/:id':'maestros/MaestrosOficinasController.activarRutas',
  'GET /admin/usuarios':'admin/AdminUserController.index',
  'POST /admin/usuarios/crear':'admin/AdminUserController.crear',
  'GET /admin/usuarios/obtener':'admin/AdminUserController.obtener',
  'POST /admin/usuarios/actualizar':'admin/AdminUserController.actualizar',
  'GET /admin/usuarios/eliminar/:id':'admin/AdminUserController.eliminar',
  'GET /admin/usuarios/activar/:id':'admin/AdminUserController.activar',
  'GET /admin/usuarios/sucursales/:id':'admin/AdminUserController.sucursales',
  'POST /admin/usuarios/sucursales/guardar':'admin/AdminUserController.guardarSucursales',
  'GET /admin/permisos':'admin/AdminPermissionController.index',
  'POST /admin/permisos/crear':'admin/AdminPermissionController.crear',
  'GET /admin/permisos/obtener':'admin/AdminPermissionController.obtener',
  'POST /admin/permisos/actualizar':'admin/AdminPermissionController.actualizar',
  'GET /admin/permisos/eliminar/:id':'admin/AdminPermissionController.eliminar',
  'GET /admin/permisos/activar/:id':'admin/AdminPermissionController.activar',
  'GET /admin/puestos':'admin/AdminPuestosController.index',
  'POST /admin/puestos/crear':'admin/AdminPuestosController.crear',
  'GET /admin/puestos/obtener':'admin/AdminPuestosController.obtener',
  'POST /admin/puestos/actualizar':'admin/AdminPuestosController.actualizar',
  'GET /admin/puestos/eliminar/:id':'admin/AdminPuestosController.eliminar',
  'GET /admin/puestos/activar/:id':'admin/AdminPuestosController.activar',
  'GET /admin/roles':'admin/AdminRoleController.index',
  'POST /admin/roles/crear':'admin/AdminRoleController.crear',
  'GET /admin/roles/obtener':'admin/AdminRoleController.obtener',
  'POST /admin/roles/actualizar':'admin/AdminRoleController.actualizar',
  'GET /admin/roles/eliminar/:id':'admin/AdminRoleController.eliminar',
  'GET /admin/roles/activar/:id':'admin/AdminRoleController.activar',
  'GET /admin/roles/permisos/:id':'admin/AdminRoleController.permisos',
  'POST /admin/roles/permisos/guardar':'admin/AdminRoleController.guardarPermisos',
  'GET /admin/oficinas':'admin/AdminOficinasController.index',
  'POST /admin/oficinas/crear':'admin/AdminOficinasController.crear',
  'GET /admin/oficinas/obtener':'admin/AdminOficinasController.obtener',
  'POST /admin/oficinas/actualizar':'admin/AdminOficinasController.actualizar',
  'GET /admin/oficinas/eliminar/:id':'admin/AdminOficinasController.eliminar',
  'GET /admin/oficinas/activar/:id':'admin/AdminOficinasController.activar',
  'GET /admin/oficinas/:id':'admin/AdminOficinasController.mostrarOficina',
  'GET /admin/maestros':'admin/AdminMaestrosController.index',
  'POST /admin/maestros/prioridades/crear':'admin/AdminMaestrosController.crearPrioridad',
  'GET /admin/maestros/prioridades/obtener':'admin/AdminMaestrosController.obtenerPrioridad',
  'POST /admin/maestros/prioridades/actualizar':'admin/AdminMaestrosController.actualizarPrioridad',
  'GET /admin/maestros/prioridades/eliminar/:id':'admin/AdminMaestrosController.eliminarPrioridad',
  'GET /admin/maestros/prioridades/activar/:id':'admin/AdminMaestrosController.activarPrioridad',
  'POST /admin/maestros/tipos-contacto/crear':'admin/AdminMaestrosController.crearTipoContacto',
  'GET /admin/maestros/tipos-contacto/obtener':'admin/AdminMaestrosController.obtenerTipoContacto',
  'POST /admin/maestros/tipos-contacto/actualizar':'admin/AdminMaestrosController.actualizarTipoContacto',
  'GET /admin/maestros/tipos-contacto/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContacto',
  'GET /admin/maestros/tipos-contacto/activar/:id':'admin/AdminMaestrosController.activarTipoContacto',
  'POST /admin/maestros/tipos-intervencion/crear':'admin/AdminMaestrosController.crearTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/obtener':'admin/AdminMaestrosController.obtenerTipoIntervencion',
  'POST /admin/maestros/tipos-intervencion/actualizar':'admin/AdminMaestrosController.actualizarTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/activar/:id':'admin/AdminMaestrosController.activarTipoIntervencion',
  'POST /admin/maestros/tipos-contrato/crear':'admin/AdminMaestrosController.crearTipoContrato',
  'GET /admin/maestros/tipos-contrato/obtener':'admin/AdminMaestrosController.obtenerTipoContrato',
  'POST /admin/maestros/tipos-contrato/actualizar':'admin/AdminMaestrosController.actualizarTipoContrato',
  'GET /admin/maestros/tipos-contrato/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContrato',
  'GET /admin/maestros/tipos-contrato/activar/:id':'admin/AdminMaestrosController.activarTipoContrato',
  'POST /admin/maestros/tipos-avisos/crear':'admin/AdminMaestrosController.crearAvisos',
  'GET /admin/maestros/tipos-avisos/obtener':'admin/AdminMaestrosController.obtenerAvisos',
  'POST /admin/maestros/tipos-avisos/actualizar':'admin/AdminMaestrosController.actualizarAvisos',
  'GET /admin/maestros/tipos-avisos/eliminar/:id':'admin/AdminMaestrosController.eliminarAvisos',
  'GET /admin/maestros/tipos-avisos/activar/:id':'admin/AdminMaestrosController.activarAvisos',
  'POST /admin/maestros/tipo-problemas/crear':'admin/AdminMaestrosController.crearTipoProblemas',
  'GET /admin/maestros/tipo-problemas/obtener':'admin/AdminMaestrosController.obtenerTipoProblemas',
  'POST /admin/maestros/tipo-problemas/actualizar':'admin/AdminMaestrosController.actualizarTipoProblemas',
  'GET /admin/maestros/tipo-problemas/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoProblemas',
  'GET /admin/maestros/tipo-problemas/activar/:id':'admin/AdminMaestrosController.activarTipoProblemas',
  'POST /admin/maestros/tipo-contadores/crear':'admin/AdminMaestrosController.crearTipoContadores',
  'GET /admin/maestros/tipo-contadores/obtener':'admin/AdminMaestrosController.obtenerTipoContadores',
  'POST /admin/maestros/tipo-contadores/actualizar':'admin/AdminMaestrosController.actualizarTipoContadores',
  'GET /admin/maestros/tipo-contadores/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContadores',
  'GET /admin/maestros/tipo-contadores/activar/:id':'admin/AdminMaestrosController.activarTipoContadores',
  'GET /admin/maestros/plantillas':'admin/AdminPlantillasCheckingController.index',
  'POST /admin/maestros/plantillas/crear':'admin/AdminPlantillasCheckingController.crear',
  'GET /admin/maestros/plantillas/obtener':'admin/AdminPlantillasCheckingController.obtener',
  'POST /admin/maestros/plantillas/actualizar':'admin/AdminPlantillasCheckingController.actualizar',
  'GET /admin/maestros/plantillas/eliminar/:id':'admin/AdminPlantillasCheckingController.eliminar',
  'GET /admin/maestros/plantillas/activar/:id':'admin/AdminPlantillasCheckingController.activar',
  'GET /admin/maestros/plantillas/:id':'admin/AdminPlantillasCheckingController.editarIndex',
  'POST /admin/maestros/plantillas/campos/crear':'admin/AdminPlantillasCheckingController.crearCampo',
  'GET /admin/maestros/plantillas/campos/obtener':'admin/AdminPlantillasCheckingController.obtenerCampo',
  'POST /admin/maestros/plantillas/campos/actualizar':'admin/AdminPlantillasCheckingController.actualizarCampo',
  'GET /admin/maestros/plantillas/campos/eliminar/:id':'admin/AdminPlantillasCheckingController.eliminarCampo',
  'GET /admin/maestros/plantillas/campos/activar/:id':'admin/AdminPlantillasCheckingController.activarCampo',
  'GET /chat/historial/:id':'chat/ChatController.cargarHistorial',
  'POST /chat/enviar':'chat/ChatController.enviarMensaje',
  'GET /usuarios/conectados':'chat/ChatController.listaConectados',
  'GET /chat/conectar':'chat/ChatController.conectar',
}

/*'GET /non-authorization':'AuthController.nonAuthorization',
  'GET /user/sync-socket':'AuthController.syncSocket',
  'GET /': 'DashboardController.index',
  'get /login': 'AuthController.Inicio',
  'post /login': 'AuthController.login',
  'get /logout': 'AuthController.logout',
  'post /forget-password': 'AuthController.forgetPassword',
  'post /recover-password': 'AuthController.recoverPassword',
  'get /forget-password': 'AuthController.olvidarContrasena',
  'get /recover-password/:id': 'AuthController.recuperarContrasena',
  'GET /config/oficinas/obtener':'AuthController.obtenerOficina',
  'POST /config/oficinas/cambiar':'AuthController.cambiarOficina',
  */
/*function parseRoute(routeKey, routeValue) {
    // 1. Método y ruta
    const [metodo, ruta] = routeKey.split(' ');

    let tipo = '';
    let controlador = '';
    let accion = '';

    // 2. Separar tipo y controlador
    if (routeValue.includes('/')) {
        const [tipoPart, controllerPart] = routeValue.split('/');

        tipo = tipoPart;

        if (controllerPart.includes('.')) {
            const [ctrl, act] = controllerPart.split('.');
            controlador = ctrl;
            accion = act;
        }
    } else {
        // Caso especial: AuthController.login
        if (routeValue.includes('.')) {
            const [ctrl, act] = routeValue.split('.');
            controlador = ctrl;
            accion = act;
            tipo = 'auth'; // puedes ajustar esto si quieres
        }
    }

    return {
        metodo,
        ruta,
        tipo,
        controlador,
        accion
    };
}*/
async function cargarPermisos(routes) {
    for (const [routeKey, routeValue] of Object.entries(routes)) {

        // 1. Método y ruta
        const [metodo, ruta] = routeKey.split(' ');

        let tipo = '';
        let controlador = '';
        let accion = '';

        // 2. Parseo principal
        if (routeValue.includes('/')) {
            const [tipoPart, controllerPart] = routeValue.split('/');

            tipo = tipoPart.toLowerCase();

            if (controllerPart.includes('.')) {
                const [ctrl, act] = controllerPart.split('.');
                controlador = ctrl.replace('Controller', '');
                accion = act;
            }
        } else {
            // Caso AuthController.login
            if (routeValue.includes('.')) {
                const [ctrl, act] = routeValue.split('.');
                controlador = ctrl.replace('Controller', '');
                accion = act;
                tipo = 'auth';
            }
        }

        // Validación básica
        if (!metodo || !ruta || !controlador || !accion) {
            console.log('Ruta inválida:', routeKey, routeValue);
            continue;
        }

        try {
            // 3. Evitar duplicados
            const existe = await Permission.findOne({
                ruta,
                metodo
            });

            if (!existe) {
                await Permission.create({
                    nombre: accion,       // 👈 aquí lo que pediste
                    ruta,
                    metodo,
                    tipo,
                    controlador,
                    accion,
                    activo: 1
                });

                console.log(`✅ Insertado: ${metodo} ${ruta}`);
            } else {
                console.log(`⚠️ Ya existe: ${metodo} ${ruta}`);
            }

        } catch (err) {
            console.error('❌ Error al insertar:', err);
        }
    }
}

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
    //console.log(req.params,"chat iniciado")
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
        }).sort('createdAt ASC').limit(100);

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
  crearPermisos:async function (req,res){
    //console.log("Rutas")
    //const resultado = Object.entries(rutas).map(([key, value]) =>
        cargarPermisos(rutas)
    //);
    console.log(resultado)
  }

};
