module.exports={
    attributes: {
        notas:{type:'string'},
        fechaInicio:{type:'ref',columnType:'datetime'},
        fechaCierre:{type:'ref',columnType:'datetime'},
        firma:{type:'string'},
        atendidoPor:{model:'user'},
        observaciones: { type: 'string' },
        tiemporespuesta:{type:'number'},
        tiemposolucion:{type:'number'},
        trEstimado:{type:'number',defaultsTo:240},//Para oficina Dueña
        trPoliza:{type:'number',defaultsTo:240},//Para pólizas
        estado:{type:'string',defaultsTo:''},
        coordenadas: { type: 'json',defaultsTo:'' },
        kminicial:{type:'number'},
        kmfinal:{type:'number'},
        nombreContacto:{type:'string',defaultsTo:''},
        puestoContacto:{type:'string',defaultsTo:''},
        emailContacto:{type:'string',defaultsTo:''},
        aviso: { model: 'avisos' },
        matricula:{model:'autos'},
        tipoIntervencion: { model:'tipointervencion' },
        tipoAviso: { model:'tipoavisos' }, 
        oficina:{model:'oficinas'},
        cliente:{model:'clientes'},
        ubicacion:{model:'clienteubicacion'},
        contacto:{model:'clientecontacto'},
        contadores:{collection:'intervencioncontadores',via:'intervencion'},
        equipos:{collection:'intervencionequipo',via:'intervencion'},
        articulos:{collection:'intervencionarticulos',via:'intervencion'}
    }
}