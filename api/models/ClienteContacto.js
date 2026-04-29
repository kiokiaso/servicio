

module.exports = {
  attributes: {
    nombre:{
        type:'string',
    },
    email:{
        type:'string'
    },
    telefono:{
        type:'string'
    },
    ubicacion:{
        model:'clienteubicacion',
        required:true
    },
    tipocontacto:{
        model:'tipocontacto',
        required:true
    },
    oficina:{
        model:'oficinas',
        required:true
    },
    cliente:{
        model:'clientes',
        required:true
    },
    activo:{
        type:'number',
        defaultsTo:1
    }
  },
};