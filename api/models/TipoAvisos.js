module.exports = {
  attributes: {
    nombre: {//{Averia,Toner,Lectura,Mantenimiento Preventivo}
      type: "string",
    },
    troficinas: {
      type:'boolean',
      defaultsTo:false
    },
    tr:{
      type:'number',defaultsTo:30
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    problemas:{
      collection:'tipoproblemas',
      via:'tipoAvisos'
    },
    contadores: {
      collection: "tipocontadores",
      via: "tipoAvisos",
    },
    plantillas: {
      collection: "plantillas",
      via: "tipoAvisos",
    },
  },
};