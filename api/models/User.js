/**
 * User.js
 *
 * A user who can log in to this application.
 */

module.exports = {
  attributes: {
    nombre: {
      type: "string",
      required: true,
    },
    email: {
      type: "string",
      required: true,
      unique: true,
    },
    isLoggedIn:{
      type:'string',
      defaultsTo:'false'
    },
    color:{
      type:'string',
      defaultsTo:''
    },
    password: {
      type: "string",
      required: true,
      protect:true
    },
    avatar:{
      type:'string',
      defaultsTo:'/images/perfil/vacio.png'
    },
    iniciales:{
      type:'string',
      defaultsTo:''
    },
    movil:{
      type:'string',
      defaultsTo:''
    },
    socketId:{
      type:'string',
      defaultsTo:''
    },
    activeConnections:{
      type:'number',
      defaultsTo:0
    },
    coordinador:{
      type:'boolean',
      defaultsTo:false
    },
    horacomida:{ type:'string',defaultsTo:'14:00' },
    online:{
      type:'boolean',
      defaultsTo:false
    },
    lastSessionId:{
      type:'string', //Almacena el id de la sesión actual
      defaultsTo:''
    },
    deviceIp:{
      type:'string',
      defaultsTo:''
    },
    deviceInfo:{
      type:'json',
      defaultsTo:''
    },
    intentosFallidos:{
      type:'number',
      defaultsTo:0
    },
    bloqueadoHasta:{
      type:'ref',
      columnType:'datetime'
    },
    ultimoLogin: {
      type: "ref",
      columnType: "datetime",  
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    roles:{
      model:'role',
      columnName:'roleId'
    },
    puestos:{
      model:'puestos',
      columnName:'puestosId',
    },
    oficinas:{
      model:'oficinas',
      columnName:'oficinasId'
    },
    accesooficinas: {
      collection: "oficinas",
      via: "user",
    },
    historiaKilometraje:{
      collection:'kilometraje',
      via:'usuario'
    },
    oficinaActual:{model:'oficinas'}
  },
  customToJSON: function() {
    // Retorna una copia del objeto omitiendo los campos sensibles
    return _.omit(this, ['password', 'createdAt', 'updatedAt']);
  },
};
