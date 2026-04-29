

module.exports = {
  attributes: {
    cantidad:{
        type:'number',
        defaultsTo:0,min:0
    },
    costopromedio:{
        type:'number',
        columnType:'float',
        defaultsTo:0
    },
    ultimoCostoReal:{
        type:'number',
        columnType:'float',
        defaultsTo:0
    },
    stockMinimo:{
        type:'number',
        defaultsTo:0
    },
    articulo:{
        model:'articulos',
        required:true
    },
    oficina:{
        model:'oficinas',
        required:true
    }
  },
};