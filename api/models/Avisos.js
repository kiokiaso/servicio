module.exports={
    attributes: {
        folio: { type: 'string', required: true },
        cliente: { model: 'clientes' },
        ubicacion: { model: 'clienteubicacion' },
        contacto: { model: 'clientecontacto' },
        creadoPor: { model: 'user' },
        atendidoPor: { model: 'user' },
        fechaAtencion: { type: 'ref', columnType: 'datetime' },
        fechaFin: { type: 'ref', columnType: 'datetime' },
        fechaInicio: { type: 'ref', columnType: 'datetime' },
        fechaCierre: { type: 'ref', columnType: 'datetime' },
        tiemporespuesta:{type:'number'},
        tiemposolucion:{type:'number'},
        tipoAviso: { model:'tipoavisos' }, // Ej: Preventivo, Correctivo
        activo:{
            type:'number',defaultsTo:1
        },
        estado:{
            type:'string',defaultsTo:'pendiente'//finalizado
        },
        trEstimado:{//Para oficina dueña
            type:'number',defaultsTo:240
        },
        trPoliza:{type:'number',defaultsTo:240},//Para pólizas
        motivoabierto:{type:'string'},
        observaciones:{type:'string'},
        prioridad:{model:'prioridad'},
        // Relación con materiales
        materiales: { collection: 'cargamaterial', via: 'aviso' },
        // Relación muchos a muchos con equipos
        equiposInvolucrados: { collection: 'avisoequipo', via: 'aviso' },
        oficina:{model:'oficinas'},
        asistencia:{model:'asistenciaslecturas'}
    }
}