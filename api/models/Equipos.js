module.exports = {
  attributes: {
    numeroserie: {
      type: "string",
      required: true,
    },
    marca:{
        type:'string'
    },
    modelo:{
        type:'string'
    },
    sitio:{
        type:'string'
    },
    descripcion:{
        type:'string'
    },
    notas:{
        type:'string'
    },
    trEstimado:{//Tiempo de respuesta para la oficina dueña
      type:'number',
      defaultsTo:240
    },
    trPoliza:{//Tiempo de respuesta para la oficina asignada en póliza
      type:'number',
      defaultsTo:240
    },
    fechainstalacion:{
        type:'string'
    },
    tamano:{
        type:'string'
    },
    tipocolor:{
        type:'string'
    },
    tipoequipo:{
        type:'string'
    },
    fechadevolucion:{
        type:'string',
        defaultsTo:''
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    baja:{
      type:'boolean',
      defaultsTo:false
    },
    fechabaja:{
        type:'string',
        defaultsTo:''
    },
    motivobaja:{
        type:'string',
        defaultsTo:''
    },
    oficina:{
        model:'oficinas'
    },
    articulo:{
        model:'articulos'
    },
    series:{
        model:'series'
    },
    cliente:{
        model:'clientes'
    },
    ubicacion:{
        model:'ClienteUbicacion'
    },
    plantillas:{
        model:'plantillas'
    },
    equiposAviso: { collection: 'avisoequipo', via: 'equipo' },
    contadores:{collection:'intervencioncontadores',via:'equipo'},
    intervenciones:{collection:'intervencionequipo',via:'equipo'}
  },
};