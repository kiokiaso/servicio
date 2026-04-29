module.exports = {
  // Lista principal
  index: async function (req, res) {
    const oficinaId = req.oficinaElegida.id;
    const ubicacionesAtendidas = await ClienteUbicacion.find({
      oficinaAtencion: oficinaId,activo:1
    });
    const idsClientesForaneos = _.map(ubicacionesAtendidas, 'cliente');

    // 2. Obtenemos los clientes (propios + foraneos por ubicación)
    let clientes = await Clientes.find({activo:1,
      or: [
        { oficina: oficinaId }, // Soy el dueño
        { id: idsClientesForaneos }          // No soy el dueño, pero atiendo una sede
      ]
    })
    .populate('oficina')
    .populate('ubicaciones', { 
      where: { oficinaAtencion: oficinaId,activo:1 } // Opcional: Solo traer las que yo atiendo
    });

    // 3. Marcamos cuáles son "Póliza" para la vista
    clientes = clientes.map(c => {
      c.esPolizaForanea = (c.oficina.id !== oficinaId);
      return c;
    });
    let tipoContacto=await TipoContacto.find({activo:1})
    let rutas=await Rutas.find({activo:1,oficina:oficinaId})
    
    return res.view('pages/clientes/clientes', { clientes,tipoContacto,rutas });
  },
  // Ficha detallada
  ficha: async function (req, res) {
    let cliente = await Clientes.findOne({ id: req.param('id') })
      .populate('contactos',{where:{activo:1}})
      .populate('ubicaciones',{where:{activo:1}}).populate('equipos',{where:{activo:1,baja:false}}).populate('ruta').populate('oficina');
      //el where en equipos, es para saber si el articulo no ha sido devuelto al almacén y la baja para saber si no ha sido dado de baja, no debe aparecer en ninguno de los dos casos;
    if (!cliente) return res.notFound();
    // 1. Extraemos todos los IDs de 'oficinaAtencion' que existan en las ubicaciones
    const idsOficinasAtencion = cliente.ubicaciones
      .map(u => u.oficinaAtencion)
      .filter(id => id); // Quitamos nulos o vacíos
    if (idsOficinasAtencion.length > 0) {
      // 2. Buscamos los datos completos de esas oficinas en una sola consulta
      const oficinasCompletas = await Oficinas.find({ id: idsOficinasAtencion });

      // 3. Cruzamos los datos: reemplazamos el ID por el Objeto Completo en cada ubicación
      //let result=await Promise.all(articulos.map(async art=>{
      cliente.ubicaciones =await Promise.all( cliente.ubicaciones.map(async u => {
        if (u.oficinaAtencion) {
          u.oficinaAtencion = oficinasCompletas.find(o => o.id == u.oficinaAtencion) || u.oficinaAtencion;
        }
        return u;
      }));
    }
    cliente.ubicaciones =await Promise.all( cliente.ubicaciones.map(async u => {
        u.ruta = await Rutas.findOne({
          id: u.ruta
        });
        return u;
    }));
    cliente.contactos =await Promise.all( cliente.contactos.map(async u => {
        u.ubicacion = await ClienteUbicacion.findOne({
          id: u.ubicacion
        });
        u.tipocontacto = await TipoContacto.findOne({
          id: u.tipocontacto
        });
        return u;
    }));
    
    cliente.equipos =await Promise.all( cliente.equipos.map(async u => {
        u.ubicacion = await ClienteUbicacion.findOne({
          id: u.ubicacion
        });
        u.articulo = await Articulos.findOne({
          id: u.articulo
        });
        u.series = await Series.findOne({
          id: u.series
        });
        return u;
    }));
    cliente.oficina.id!=req.oficinaElegida.id?cliente.esPolizaForanea=true:cliente.esPolizaForanea=false;
    
    let tipoContacto=await TipoContacto.find({activo:1})
    let oficinas=await Oficinas.find({activo:1})
    let rutas=await Rutas.find({activo:1,oficina:req.oficinaElegida.id})
    let plantillas=await Plantillas.find({activo:1});
    
    //console.log(cliente.equipos)
    return res.view('pages/clientes/ficha', { cliente,tipoContacto,rutas, plantillas,oficinas });
  },

  // Crear Cliente
  crear: async function (req, res) {
    let codigo=await Clientes.findOne({codigo:req.body.codigo,oficina:req.oficinaElegida.id}).populate('oficina');
    if(codigo){
      req.addFlash('mensaje', `El código de cliente que intentas agregar ya existe con <strong>${codigo.razonsocial}</strong>, revisa en inactivos para que lo puedas activar o busca bien el código del cliente`);
      return res.redirect('/clientes');
    }
    try {
        let datos=req.body;
        datos.oficina=req.oficinaElegida.id
      let nuevo = await Clientes.create(datos).fetch();
      let ubicacion = await ClienteUbicacion.create({nombre:'Principal',direccion:datos.direccion,cliente:nuevo.id,ruta:datos.ruta}).fetch();
      return res.redirect('/clientes');
    } catch (err) {
      return res.serverError(err);
    }
  },
  actualizar: async function(req,res){
    let datos=req.body;
    let id=datos.id;
    delete datos.id
    const data=await Clientes.updateOne({id:id}).set(datos)
    data.ruta=await Rutas.findOne({id:data.ruta})
    //let data = await Cliente.findOne({ id: id });
    if (data) {
      res.status(200).send({ data,resp:1 });
    } else {
       res.status(200).send({ data,resp:0 });
    }
  },
  //UBICACION
  agregarUbicacion: async function(req,res){
    let query=req.body;
    let local=query.local=="Si"?true:false
    let datos={
      nombre:query.nombreUbicacion,
      direccion:query.direccionUbicacion,
      cliente:query.clienteUbicacion,
      ruta:query.rutaUbicacion,
      horario:query.horarioUbicacion,
      local:local
    }
    if(query.atencion=="Si"){
      datos.oficinaAtencion=query.oficinas
      datos.localPoliza=true
    }
    let ubicacion = await ClienteUbicacion.create(datos).fetch();
    ubicacion.ruta=await Rutas.findOne({id:ubicacion.ruta})
    if(query.atencion=="Si"){
      ubicacion.oficinaAtencion=await Oficinas.findOne({id:ubicacion.oficinaAtencion})
    }
    //let data = await Cliente.findOne({ id: id });
    if (ubicacion) {
      res.status(200).send({ ubicacion,resp:1 });
    } else {
       res.status(200).send({ ubicacion,resp:0 });
    }
  },
  eliminarUbicacion: async function(req,res){
    const data=await ClienteUbicacion.updateOne({id:req.query.id}).set({activo:0})
    
    if (data) {
      res.status(200).send({ data,resp:1 });
    } else {
       res.status(200).send({ data,resp:0 });
    }
  },
  obtenerUbicacion: async function(req,res){
    const data=await ClienteUbicacion.findOne({id:req.query.id})
    
    if (data) {
      res.status(200).send({ data,resp:1 });
    } else {
       res.status(200).send({ data,resp:0 });
    }
  }, 
  actualizarUbicacion: async function(req,res){
    let query=req.body;
    let local=query.localE=="Si"?true:false
    let datos={
      nombre:query.nombreUbicacionE,
      direccion:query.direccionUbicacionE,
      cliente:query.clienteUbicacionE,
      ruta:query.rutaUbicacionE,
      horario:query.horarioUbicacionE,
      oficinaAtencion:null
    }
    if(query.atencionE=="Si"){
      console.log("Entra póliza")
      datos.oficinaAtencion=query.oficinasE
      if(query.oficinasE==req.oficinaElegida.id){
        datos.localPoliza=local
      }else{
        datos.local=local
      }
      
    }else{
      console.log("Entra local")
      datos.oficinaAtencion=null
      datos.local=local
    }
    console.log("Datos:",datos)
    //let ubicacion = await ClienteUbicacion.update({id:req.body.idUbicacion},datos).fetch();
    const ubicacion=await ClienteUbicacion.updateOne({id:req.body.idUbicacion}).set(datos)
    console.log(ubicacion)
    ubicacion.ruta=await Rutas.findOne({id:ubicacion.ruta})
    if(query.atencionE=="Si"){
      ubicacion.oficinaAtencion=await Oficinas.findOne({id:ubicacion.oficinaAtencion})
    }else{
      ubicacion.oficinaAtencion=null
    }
    //let data = await Cliente.findOne({ id: id });
    if(query.atencionE=="Si"){
      let tr=240;
      if(local==false){
        tr=480
      }
      await Equipos.update({ubicacion:ubicacion.id}).set({trPoliza:Number(tr)});
    }
    if (ubicacion) {
      res.status(200).send({ ubicacion,resp:1 });
    } else {
       res.status(200).send({ ubicacion,resp:0 });
    }
  },
  //CONTACTOS
  agregarContacto: async function(req,res){
    let query=req.body;
    let cliente=await Clientes.findOne({id:req.body.clienteContacto});
    let datos={
      nombre:query.nombreContacto,
      email:query.emailContacto,
      cliente:cliente.id,
      oficina:cliente.oficina,
      telefono:query.telefonoContacto,
      ubicacion:query.ubicacionContacto,
      tipocontacto:query.tipoContacto
    }
    console.log(datos)
    let contacto = await ClienteContacto.create(datos).fetch();
    contacto.tipocontacto=await TipoContacto.findOne({id:contacto.tipocontacto})
    contacto.ubicacion=await ClienteUbicacion.findOne({id:contacto.ubicacion})
    
    //let data = await Cliente.findOne({ id: id });
    if (contacto) {
      res.status(200).send({ contacto,resp:1 });
    } else {
       res.status(200).send({ contacto,resp:0 });
    }
  },
  eliminarContacto: async function(req,res){
    const data=await ClienteContacto.updateOne({id:req.query.id}).set({activo:0})
    
    if (data) {
      res.status(200).send({ data,resp:1 });
    } else {
       res.status(200).send({ data,resp:0 });
    }
  },
  obtenerContacto: async function(req,res){
    const data=await ClienteContacto.findOne({id:req.query.id})
    
    if (data) {
      res.status(200).send({ data,resp:1 });
    } else {
       res.status(200).send({ data,resp:0 });
    }
  }, 
  actualizarContacto: async function(req,res){
    let query=req.body;
    let datos={
      nombre:query.nombreContactoE,
      email:query.emailContactoE,
      telefono:query.telefonoContactoE,
      ubicacion:query.ubicacionContactoE,
      tipocontacto:query.tipoContactoE
    }
    //let ubicacion = await ClienteUbicacion.update({id:req.body.idUbicacion},datos).fetch();
    const contacto=await ClienteContacto.updateOne({id:req.body.idContacto}).set(datos)

    contacto.tipocontacto=await TipoContacto.findOne({id:contacto.tipocontacto})
    contacto.ubicacion=await ClienteUbicacion.findOne({id:contacto.ubicacion})
   
    //let data = await Cliente.findOne({ id: id });
    if (contacto) {
      res.status(200).send({ contacto,resp:1 });
    } else {
       res.status(200).send({ contacto,resp:0 });
    }
  },
  //Coordenadas
  clienteCoordenadas:async function(req,res){
    console.log(req.body)
    await Clientes.update({id:req.body.id},{
        coordenadas: req.body.coordenadas
     });
     return res.ok();
  }, 
  ubicacionCoordenadas:async function(req,res){
    await ClienteUbicacion.update({id:req.body.id},{
        coordenadas: req.body.coordenadas
     });
     return res.ok();
  },
  desactivar:async function(req,res){
    await Clientes.update({id:req.params.id},{
        activo: 0
     });
    return res.redirect("/clientes");
  },
  activar:async function(req,res){
    await Clientes.update({id:req.params.id},{
        activo: 1
     });
    return res.redirect("/clientes/inactivos");
  },
  // Cambiar estatus (Activo/Moroso)
  toggleStatus: async function (req, res) {
    const { id, campo } = req.allParams(); // campo = 'activo' o 'moroso'
    let cliente = await Cliente.findOne({ id });
    let nuevoValor = !cliente[campo];
    await Cliente.updateOne({ id }).set({ [campo]: nuevoValor });
    return res.ok();
  },
  //CLIENTES INACTIVOS
  inactivos: async function (req, res) {
    const oficinaId = req.oficinaElegida.id;
    const ubicacionesAtendidas = await ClienteUbicacion.find({
      oficinaAtencion: oficinaId,activo:1
    });
    const idsClientesForaneos = _.map(ubicacionesAtendidas, 'cliente');

    // 2. Obtenemos los clientes (propios + foraneos por ubicación)
    let clientes = await Clientes.find({activo:0,
      or: [
        { oficina: oficinaId }, // Soy el dueño
        { id: idsClientesForaneos }          // No soy el dueño, pero atiendo una sede
      ]
    })
    .populate('oficina')
    .populate('ubicaciones', { 
      where: { oficinaAtencion: oficinaId,activo:1 } // Opcional: Solo traer las que yo atiendo
    });

    // 3. Marcamos cuáles son "Póliza" para la vista
    clientes = clientes.map(c => {
      c.esPolizaForanea = (c.oficina.id !== oficinaId);
      return c;
    });
    let tipoContacto=await TipoContacto.find({activo:1})
    let rutas=await Rutas.find({activo:1,oficina:oficinaId})
    
    return res.view('pages/clientes/inactivos', { clientes });
  },
};
