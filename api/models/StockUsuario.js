
module.exports = {
  attributes: {
    cantidad:{
        type:'number',
        required:true,
        min:0
    },
    costopromedio:{
        type:'number',
        columnType:'float'
    },
    articulo:{
        model:'articulos',
        required:true
    },
    usuario:{
        model:'user',
        required:true
    },
    oficina:{
        model:'oficinas',
        required:true
    }
  },
};