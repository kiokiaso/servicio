module.exports={
    attributes: {
        notas:{type:'string'},
        fechaInicio: { type: 'ref', columnType: 'datetime' },
        fechaCierre: { type: 'ref', columnType: 'datetime' },
        tiemporespuesta:{type:'number'},
        tiemposolucion:{type:'number'},
        trEstimado:{type:'number',defaultsTo:240},//Para oficina Dueña
        trPoliza:{type:'number',defaultsTo:240},//Para pólizas
        plantilla:{ type:'json',defaultsTo:''},
        observaciones: { type: 'string' },
        atendidoPor:{model:'user'},
        aviso: { model: 'avisos' },
        equipo: { model: 'equipos' },
        tipoIntervencion: { model:'tipointervencion' },
        tipoAviso: { model:'tipoavisos' },
        avisoEquipo: { model:'avisoequipo' },
        tipoProblema: { model:'tipoproblemas' }, // El problema específico de ESTE equipo en ESTE aviso
        oficina:{model:'oficinas'},
        cliente:{model:'clientes'},
        ubicacion:{model:'clienteubicacion'},
        contacto:{model:'clientecontacto'},
        intervencion:{model:'intervenciones'},
        contadores:{collection:'intervencioncontadores',via:'intervencionEquipo'},
        articulos:{collection:'intervencionarticulos',via:'intervencionEquipo'}
    }
}