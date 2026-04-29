const { attributes } = require("./Autos");

module.exports={
    attributes:{
        tipo:{
            type:'string',
            isIn:['COMPRA','VENTA','TRANSFERENCIA','USO_INTERNO','DEVOLUCION'],//Para informes tomar en cuenta, Venta y uso interno
            required:true
        },
        cantidad:{
            type:'number',
            required:true
        },
        costoAplicado:{
            type:'number',
            columnType:'float'
        },
        concepto:{
            type:'string'
        },
        series:{
            type:'json',
        },
        fecha:{
            type:'ref',
            columnType:'datetime',
            defaultsTo:new Date()
        },
        articulo:{
            model:'articulos',
            required:true,
        },
        oficina:{
            model:'oficinas',
            required:true,
        },
        usuarioResponsable:{
            model:'user',
            required:true,//El que realiza el movimiento
        },
        usuarioAsignado:{
            model:'user',//El que recibe el artículo usado en las transferencias de articulos
            required:false,
        }
    }
}