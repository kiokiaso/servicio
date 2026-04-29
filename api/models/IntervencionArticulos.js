module.exports={
    attributes: {
        cantidad:{type:'number'},
        costopromedio:{type:'number',columnType:'float'},
        costopublico:{type:'number',columnType:'float'},
        contador:{type:'number'},
        articulo:{model:'articulos'},
        tipoAviso:{model:'tipoAvisos'},
        atendidoPor:{model:'user'},
        aviso: { model: 'avisos' },
        equipo: { model: 'equipos' }, 
        oficina:{model:'oficinas'},
        cliente:{model:'clientes'},
        ubicacion:{model:'clienteubicacion'},
        intervencion:{model:'intervenciones'},
        intervencionEquipo:{model:'intervencionEquipo'},
        avisoEquipo: { model:'avisoequipo' },
    }
}