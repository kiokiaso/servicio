
module.exports = {
  attributes: {
    valor: {
      type: "number",
    },
    activo:{
      type:'number',
      defaultsTo:1
    },
    usuario:{
        model:'user',
        required:true
    },
    auto:{
        model:'autos',
        required:true
    }
  },
};

/*
    Si quieres sacar un reporte donde se vea el usuario, el auto que usó y el kilometraje:

    const reportes = await Kilometraje.find()
    .populate('usuario')
    .populate('auto')
    .sort('createdAt DESC');

    // Acceso: reportes[0].usuario.nombre, reportes[0].auto.placa, reportes[0].valor

*/