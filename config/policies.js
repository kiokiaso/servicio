module.exports.policies = {
  "*": ["isAuthenticated", "hasPermission", "auditMiddleware","singleSession",'loadOficinas'],

  AuthController: {
    "*": true,
  },
};

/*
const { authenticate } = require("passport");

module.exports.policies = {
  '*': 'authenticated',
  'auth': {
    '*':true
  },
  'externo': {
    '*':true
  },
  ActividadesController: {'*':'vendedor'},
  CotizacionesController: {'*':'vendedor'},
  ClientesController: {'*':'vendedor'},
  ConcursoVentasController: {'*':'vendedor'},
  HerramientasController: {'*':'authenticated'},
  MensajeController: {'*':'authenticated'},
  OportunidadesController: {'*':'vendedor'},
  PerfilController: {'*':'authenticated'},
  ProspectoController: {'*':'vendedor'},
  PruebasController: {'*':'authenticated'},
  ReportesVentasController: {'*':'vendedor'},
  VentasController: {'*':'vendedor'},
  VersionesController: {'*':'authenticated'},
  ContratoController:{'*':'ventascredito'},
  KpiController:{
    '*':"gerente",
  },
  AlmacenController:{
    '*':'almacen',
    'inventario':['ventasalmacen']
  },
  UsuarioController:{
    '*':'superAdministrador',
    'usuarios':['administrador']
  },
  SistemaController:{
    '*':'administrator'
  },
  UsuarioController:{
    '*':'administrator'
  },
  DashboardController:{
    '*':'authenticated'
  },
  ArchivosController:{
    '*':'authenticated'
  },
  NotificacionesController:{
    '*':'authenticated'
  },
  CalendarController:{
    '*':'authenticated'
  },
  ServicioController:{
    '*':'contadorGeneral'
  },
};*/
