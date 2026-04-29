/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  'GET /': 'DashboardController.index',
//* ya se dieron de alta en permisos para los roles
 //Autenticación
  'get /login': 'AuthController.Inicio',
  'post /login': 'AuthController.login',
  'get /logout': 'AuthController.logout',
  'post /forget-password': 'AuthController.forgetPassword',
  'post /recover-password': 'AuthController.recoverPassword',
  'get /forget-password': 'AuthController.olvidarContrasena',
  'get /recover-password/:id': 'AuthController.recuperarContrasena',
  'GET /config/oficinas/obtener':'AuthController.obtenerOficina',
  'POST /config/oficinas/cambiar':'AuthController.cambiarOficina',
//AVISOS
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
  //Atención de aviso
  'GET /avisos/equipos/atender/:equipoAviso/:aviso':'avisos/AvisosController.iniciarAtencion',
  'GET /avisos/equipos/atender/:equipoAviso/:aviso/:intervencion':'avisos/AvisosController.iniciarAtencion',
  'GET /avisos/articulos/buscar': 'avisos/AvisosController.buscarArticulo',
  'POST /avisos/equipos/atender/guardar':'avisos/AvisosController.equipoAtenderGuardar',
  'GET /avisos/intervencion/finalizar/:id':'avisos/AvisosController.finalizarIntervencion',
  'GET /avisos/equipos/atender-pendiente/:equipoAviso/:aviso/:intervencion':'avisos/AvisosController.atencionPendiente',//equipo con fallas o no operativo
  'POST /avisos/equipos/atender/guardar-pendiente':'avisos/AvisosController.equipoAtenderGuardarPendiente',
  //Cierre de intervención
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
  //Avisos remotos
  'GET /avisos/remotos':'avisos/AvisosController.remotos',
  'GET /avisos/remotos/iniciar-atencion':'avisos/AvisosController.remotosIniciarAtencion',
  'POST /avisos/remotos/guardar':'avisos/AvisosController.remotosGuardar',
  //Calendario
  'GET /avisos/calendario':'avisos/AvisosController.vistaCalendario',
  'GET /avisos/eventos-calendario':'avisos/AvisosController.eventosCalendario',
  'POST /avisos/validar-y-mover':'avisos/AvisosController.validarYMover',
  'POST /avisos/actualizar-estado':'avisos/AvisosController.actualizarEstado',
  'POST /avisos/modificar-programacion-manual':'avisos/AvisosController.modificarProgramacionManual',
  'GET /avisos/obtener':'avisos/AvisosController.obtener',
//LECTURAS
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
//EQUIPOS
  //Activos
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
//ALMACEN E INVENTARIO
//Articulos
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
//Movimientos
  'GET /almacen/movimientos':'almacen/ArticulosController.movimientos',
  'GET /almacen/articulos/movimientos/:id':'almacen/ArticulosController.movimientos',
  'GET /almacen/movimientos/articulo/buscar':'almacen/ArticulosController.articulosMovBuscar',
  'GET /almacen/movimientos/tabla':'almacen/ArticulosController.tablaMovimientos',
//Stock
  'GET /almacen/stock':'almacen/ArticulosController.stock',
  'GET /almacen/stock/tabla':'almacen/ArticulosController.tablaStock',
//Transferencia entre almacenes
  'GET /almacen/transferencia':'almacen/ArticulosController.transferencia',
  'POST /almacen/transferencia':'almacen/ArticulosController.transferencia',
  'POST /almacen/transferencia/masivo':'almacen/ArticulosController.masivo',
  //Compras masivas
  'GET /almacen/compras':'almacen/ArticulosController.compras',
  'GET /almacen/articulos/buscar-compras':'almacen/ArticulosController.buscarArticulos',
  'POST /almacen/compras/agregar':'almacen/ArticulosController.agregarCompra',
//RUTAS PARA CLIENTES
  //Clientes
  'GET /clientes':'clientes/ClientesController.index',
  'GET /clientes/:id':'clientes/ClientesController.ficha',
  'POST /clientes/crear':'clientes/ClientesController.crear',
  'POST /clientes/actualizar':'clientes/ClientesController.actualizar',
  'GET /clientes/desactivar/:id':'clientes/ClientesController.desactivar',
  'POST /clientes/actualizar-coordenadas':'clientes/ClientesController.clienteCoordenadas',
  'POST /clientes/ubicacion/actualizar-coordenadas':'clientes/ClientesController.ubicacionCoordenadas',
  //Ubicaciones
  'POST /clientes/ubicacion/agregar':'clientes/ClientesController.agregarUbicacion',
  'GET /clientes/ubicacion/eliminar':'clientes/ClientesController.eliminarUbicacion',
  'GET /clientes/ubicacion/obtener':'clientes/ClientesController.obtenerUbicacion',
  'POST /clientes/ubicacion/actualizar':'clientes/ClientesController.actualizarUbicacion',
  //Contactos
  'POST /clientes/contacto/agregar':'clientes/ClientesController.agregarContacto',
  'GET /clientes/contacto/eliminar':'clientes/ClientesController.eliminarContacto',
  'GET /clientes/contacto/obtener':'clientes/ClientesController.obtenerContacto',
  'POST /clientes/contacto/actualizar':'clientes/ClientesController.actualizarContacto',
  //Equipos
  'GET /almacen/series/buscar':'almacen/ArticulosController.buscarSeries',
  'POST /clientes/equipo/agregar':'equipos/EquiposController.crearDesdeCliente',
  'GET /clientes/equipo/eliminar':'equipos/EquiposController.devolver',
  'GET /clientes/equipo/obtener':'equipos/EquiposController.obtenerEquipo',
  'POST /clientes/equipo/actualizar':'equipos/EquiposController.actualizarDesdeCliente',
  //Clientes inactivos
  'GET /clientes/inactivos':'clientes/ClientesController.inactivos',
  'GET /clientes/activar/:id':'clientes/ClientesController.activar',

//MAESTROS POR OFICINA
  //AUTOS
  'GET /maestros/autos':'maestros/MaestrosOficinasController.indexAutos',
  'POST /maestros/autos/crear':'maestros/MaestrosOficinasController.crearAutos',
  'GET /maestros/autos/obtener':'maestros/MaestrosOficinasController.obtenerAutos',
  'POST /maestros/autos/actualizar':'maestros/MaestrosOficinasController.actualizarAutos',
  'GET /maestros/autos/eliminar/:id':'maestros/MaestrosOficinasController.eliminarAutos',
  'GET /maestros/autos/activar/:id':'maestros/MaestrosOficinasController.activarAutos',
  //RUTAS
  'GET /maestros/rutas':'maestros/MaestrosOficinasController.indexRutas',
  'POST /maestros/rutas/crear':'maestros/MaestrosOficinasController.crearRutas',
  'GET /maestros/rutas/obtener':'maestros/MaestrosOficinasController.obtenerRutas',
  'POST /maestros/rutas/actualizar':'maestros/MaestrosOficinasController.actualizarRutas',
  'GET /maestros/rutas/eliminar/:id':'maestros/MaestrosOficinasController.eliminarRutas',
  'GET /maestros/rutas/activar/:id':'maestros/MaestrosOficinasController.activarRutas',
//ADMINISTRACIÓN DEL SISTEMA
  //User
  'GET /admin/usuarios':'admin/AdminUserController.index',
  'POST /admin/usuarios/crear':'admin/AdminUserController.crear',
  'GET /admin/usuarios/obtener':'admin/AdminUserController.obtener',
  'POST /admin/usuarios/actualizar':'admin/AdminUserController.actualizar',
  'GET /admin/usuarios/eliminar/:id':'admin/AdminUserController.eliminar',
  'GET /admin/usuarios/activar/:id':'admin/AdminUserController.activar',
  'GET /admin/usuarios/sucursales/:id':'admin/AdminUserController.sucursales',
  'POST /admin/usuarios/sucursales/guardar':'admin/AdminUserController.guardarSucursales',
  //Permisos
  'GET /admin/permisos':'admin/AdminPermissionController.index',//*
  'POST /admin/permisos/crear':'admin/AdminPermissionController.crear',//*
  'GET /admin/permisos/obtener':'admin/AdminPermissionController.obtener',//*
  'POST /admin/permisos/actualizar':'admin/AdminPermissionController.actualizar',//*
  'GET /admin/permisos/eliminar/:id':'admin/AdminPermissionController.eliminar',//*
  'GET /admin/permisos/activar/:id':'admin/AdminPermissionController.activar',//*
  ///Puestos
  'GET /admin/puestos':'admin/AdminPuestosController.index',
  'POST /admin/puestos/crear':'admin/AdminPuestosController.crear',
  'GET /admin/puestos/obtener':'admin/AdminPuestosController.obtener',
  'POST /admin/puestos/actualizar':'admin/AdminPuestosController.actualizar',
  'GET /admin/puestos/eliminar/:id':'admin/AdminPuestosController.eliminar',
  'GET /admin/puestos/activar/:id':'admin/AdminPuestosController.activar',
  //Roles
  'GET /admin/roles':'admin/AdminRoleController.index',
  'POST /admin/roles/crear':'admin/AdminRoleController.crear',
  'GET /admin/roles/obtener':'admin/AdminRoleController.obtener',
  'POST /admin/roles/actualizar':'admin/AdminRoleController.actualizar',
  'GET /admin/roles/eliminar/:id':'admin/AdminRoleController.eliminar',
  'GET /admin/roles/activar/:id':'admin/AdminRoleController.activar',
  'GET /admin/roles/permisos/:id':'admin/AdminRoleController.permisos',//*
  'POST /admin/roles/permisos/guardar':'admin/AdminRoleController.guardarPermisos',//*
  //Oficinas
  'GET /admin/oficinas':'admin/AdminOficinasController.index',
  'POST /admin/oficinas/crear':'admin/AdminOficinasController.crear',
  'GET /admin/oficinas/obtener':'admin/AdminOficinasController.obtener',
  'POST /admin/oficinas/actualizar':'admin/AdminOficinasController.actualizar',
  'GET /admin/oficinas/eliminar/:id':'admin/AdminOficinasController.eliminar',
  'GET /admin/oficinas/activar/:id':'admin/AdminOficinasController.activar',
  'GET /admin/oficinas/:id':'admin/AdminOficinasController.mostrarOficina',
  //Maestros del sistema o gestión de tipos
  'GET /admin/maestros':'admin/AdminMaestrosController.index',
  //PRIORIDADES
  'POST /admin/maestros/prioridades/crear':'admin/AdminMaestrosController.crearPrioridad',
  'GET /admin/maestros/prioridades/obtener':'admin/AdminMaestrosController.obtenerPrioridad',
  'POST /admin/maestros/prioridades/actualizar':'admin/AdminMaestrosController.actualizarPrioridad',
  'GET /admin/maestros/prioridades/eliminar/:id':'admin/AdminMaestrosController.eliminarPrioridad',
  'GET /admin/maestros/prioridades/activar/:id':'admin/AdminMaestrosController.activarPrioridad',
  //TIPOS DE CONTACTO
  'POST /admin/maestros/tipos-contacto/crear':'admin/AdminMaestrosController.crearTipoContacto',
  'GET /admin/maestros/tipos-contacto/obtener':'admin/AdminMaestrosController.obtenerTipoContacto',
  'POST /admin/maestros/tipos-contacto/actualizar':'admin/AdminMaestrosController.actualizarTipoContacto',
  'GET /admin/maestros/tipos-contacto/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContacto',
  'GET /admin/maestros/tipos-contacto/activar/:id':'admin/AdminMaestrosController.activarTipoContacto',
  //TIPOS DE INTERVENCION
  'POST /admin/maestros/tipos-intervencion/crear':'admin/AdminMaestrosController.crearTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/obtener':'admin/AdminMaestrosController.obtenerTipoIntervencion',
  'POST /admin/maestros/tipos-intervencion/actualizar':'admin/AdminMaestrosController.actualizarTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoIntervencion',
  'GET /admin/maestros/tipos-intervencion/activar/:id':'admin/AdminMaestrosController.activarTipoIntervencion',
  //TIPOS DE CONTRATO
  'POST /admin/maestros/tipos-contrato/crear':'admin/AdminMaestrosController.crearTipoContrato',
  'GET /admin/maestros/tipos-contrato/obtener':'admin/AdminMaestrosController.obtenerTipoContrato',
  'POST /admin/maestros/tipos-contrato/actualizar':'admin/AdminMaestrosController.actualizarTipoContrato',
  'GET /admin/maestros/tipos-contrato/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContrato',
  'GET /admin/maestros/tipos-contrato/activar/:id':'admin/AdminMaestrosController.activarTipoContrato',
  //TIPOS DE AVISOS
  'POST /admin/maestros/tipos-avisos/crear':'admin/AdminMaestrosController.crearAvisos',
  'GET /admin/maestros/tipos-avisos/obtener':'admin/AdminMaestrosController.obtenerAvisos',
  'POST /admin/maestros/tipos-avisos/actualizar':'admin/AdminMaestrosController.actualizarAvisos',
  'GET /admin/maestros/tipos-avisos/eliminar/:id':'admin/AdminMaestrosController.eliminarAvisos',
  'GET /admin/maestros/tipos-avisos/activar/:id':'admin/AdminMaestrosController.activarAvisos',
  //TIPOS DE PROBLEMAS
  'POST /admin/maestros/tipo-problemas/crear':'admin/AdminMaestrosController.crearTipoProblemas',
  'GET /admin/maestros/tipo-problemas/obtener':'admin/AdminMaestrosController.obtenerTipoProblemas',
  'POST /admin/maestros/tipo-problemas/actualizar':'admin/AdminMaestrosController.actualizarTipoProblemas',
  'GET /admin/maestros/tipo-problemas/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoProblemas',
  'GET /admin/maestros/tipo-problemas/activar/:id':'admin/AdminMaestrosController.activarTipoProblemas',
  //TIPOS DE CONTADORES
  'POST /admin/maestros/tipo-contadores/crear':'admin/AdminMaestrosController.crearTipoContadores',
  'GET /admin/maestros/tipo-contadores/obtener':'admin/AdminMaestrosController.obtenerTipoContadores',
  'POST /admin/maestros/tipo-contadores/actualizar':'admin/AdminMaestrosController.actualizarTipoContadores',
  'GET /admin/maestros/tipo-contadores/eliminar/:id':'admin/AdminMaestrosController.eliminarTipoContadores',
  'GET /admin/maestros/tipo-contadores/activar/:id':'admin/AdminMaestrosController.activarTipoContadores',
  //TIPOS DE PLANTILLAS
  'GET /admin/maestros/plantillas':'admin/AdminPlantillasCheckingController.index',
  'POST /admin/maestros/plantillas/crear':'admin/AdminPlantillasCheckingController.crear',
  'GET /admin/maestros/plantillas/obtener':'admin/AdminPlantillasCheckingController.obtener',
  'POST /admin/maestros/plantillas/actualizar':'admin/AdminPlantillasCheckingController.actualizar',
  'GET /admin/maestros/plantillas/eliminar/:id':'admin/AdminPlantillasCheckingController.eliminar',
  'GET /admin/maestros/plantillas/activar/:id':'admin/AdminPlantillasCheckingController.activar',
  //CAMPOS PARA PLANTILLAS
  'GET /admin/maestros/plantillas/:id':'admin/AdminPlantillasCheckingController.editarIndex',
  'POST /admin/maestros/plantillas/campos/crear':'admin/AdminPlantillasCheckingController.crearCampo',
  'GET /admin/maestros/plantillas/campos/obtener':'admin/AdminPlantillasCheckingController.obtenerCampo',
  'POST /admin/maestros/plantillas/campos/actualizar':'admin/AdminPlantillasCheckingController.actualizarCampo',
  'GET /admin/maestros/plantillas/campos/eliminar/:id':'admin/AdminPlantillasCheckingController.eliminarCampo',
  'GET /admin/maestros/plantillas/campos/activar/:id':'admin/AdminPlantillasCheckingController.activarCampo',

//CONECTAR SOCKET CON LA SESIÓN
  'GET /user/sync-socket':'AuthController.syncSocket',
//Chat
  'POST /chat/connect': 'ChatController.onConnect',
  'POST /chat/send': 'ChatController.sendMessage',
  'GET /chat/historial/:id':'chat/ChatController.cargarHistorial',
  'POST /chat/enviar':'chat/ChatController.enviarMensaje',
  'GET /usuarios/conectados':'chat/ChatController.listaConectados',
  'GET /chat/conectar':'chat/ChatController.conectar',
  'GET /ping': { response: 'ok' },
  //Autorizaciones
  'GET /non-authorization':'AuthController.nonAuthorization',//*
};
