module.exports={
    attributes: {
        aviso: { model: 'avisos' },
        equipo: { model: 'equipos' },
        tipoProblema: { model:'tipoproblemas' }, // El problema específico de ESTE equipo en ESTE aviso
        estado:{type:'string',defaultsTo:''},//Operativo, Operativo con Fallas, No Operativo
        estadoEquipo:{type:'string',defaultsTo:'pendiente'},//atendido,pendiente,noatendido
        observaciones: { type: 'string' },
        trEstimado:{type:'number',defaultsTo:240},//Para oficina Dueña
        trPoliza:{type:'number',defaultsTo:240},//Para pólizas
        fechaInicio: { type: 'ref', columnType: 'datetime' },
        fechaCierre: { type: 'ref', columnType: 'datetime' },
        tiemporespuesta:{type:'number'},
        tiemposolucion:{type:'number'},
        oficina:{model:'oficinas'},
        prioridad:{model:'prioridad'},
        cliente:{model:'clientes'},
        ubicacion:{model:'clienteubicacion'},
        contacto:{model:'clientecontacto'}
    }
}