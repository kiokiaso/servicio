module.exports={
    attributes: {
        valor:{type:'number'},
        valorAnterior:{type:'number',defaultsTo:0},
        bonificacion:{type:'number',defaultsTo:0},
        procesado:{type:'number',defaultsTo:0},
        aviso: { model: 'avisos' },
        equipo: { model: 'equipos' },
        tipoContador: { model:'tipocontadores' }, 
        oficina:{model:'oficinas'},
        cliente:{model:'clientes'},
        ubicacion:{model:'clienteubicacion'},
        contacto:{model:'clientecontacto'},
        intervencion:{model:'intervenciones'},
        intervencionEquipo:{model:'intervencionequipo'},
        tipoAviso:{model:'tipoavisos'},
        atendidoPor:{model:'user'},
        avisoEquipo: { model:'avisoequipo' },
    }
}