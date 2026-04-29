

module.exports = {
    index: async function (req, res) {
        let usuarios=await User.findOne({id:req.session.usuario.id}).populate('accesooficinas',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
        console.log("oficinas: ",usuarios.accesooficinas)
        return res.view("pages/almacen/articulos",{oficinas:usuarios.accesooficinas});
    },
    mostrar: async function (req, res) {
        let articulo=await Articulos.findOne({id:req.params.id}).populate('existenciasOficinas',{where:{oficina:req.oficinaElegida.id}}).populate('existenciasUsuarios');
        articulo.existenciasOficinas = await Promise.all(
            articulo.existenciasOficinas.map(async (eo) => {
                eo.oficina = await Oficinas.findOne({ id: eo.oficina });
                return eo;
            })
        );
        articulo.existenciasUsuarios = await Promise.all(
            articulo.existenciasUsuarios.map(async (eo) => {
                eo.usuario = await User.findOne({ id: eo.usuario });
                return eo;
            })
        );
        let series=await Series.find({articulo:req.params.id,oficina:req.oficinaElegida.id,activo:1});
        let almacenes=articulo.existenciasUsuarios;
        if(articulo.existenciasOficinas.length>0){
            articulo.costopromedio=articulo.existenciasOficinas[0].costopromedio;
            articulo.ultimoCostoReal=articulo.existenciasOficinas[0].ultimoCostoReal;
            articulo.stockMinimo=articulo.existenciasOficinas[0].stockMinimo;
            articulo.existencia=articulo.existenciasOficinas[0].cantidad;
            articulo.existenciasUsuarios.forEach(user => {
                //console.log("datos",user)
                articulo.existencia+=user.cantidad;
                //console.log("existencia: ",articulo.existencia)
            });
        }else{
            articulo.costopromedio=0;
            articulo.ultimoCostoReal=0;
            articulo.stockMinimo=0
            articulo.existencia=0
        }
        /*if(articulo.existenciasOficinas>0){
            articulo.existenciasUsuarios.forEach(user => {
                articulo.existencia+=user.cantidad;
            });
        }*/
        //console.log("existencias en almacenes: ",articulo)
        let oficinas=await Oficinas.findOne({id:req.oficinaElegida.id}).populate('user',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
        return res.view("pages/almacen/mostrar",{usuarios:oficinas.user,articulo,almacenes,series});
    },
    crear: async function (req, res) {
        let datos=req.body
        await Articulos.create(datos);
        return res.redirect("/almacen/articulos");
    },
    actualizar:async function(req,res){
        let datos=req.body;
        let id=req.body.id
        let stockMinimo=req.body.stockMinimo;
        delete datos.id
        delete datos.stockMinimo
        const existe=await StockOficina.findOne({articulo:id,oficina:req.oficinaElegida.id})
        if(existe){
            await StockOficina.updateOne({id:existe.id}).set({stockMinimo:stockMinimo})
        }
        else{
            await StockOficina.create({articulo:id,oficina:req.oficinaElegida.id,stockMinimo:stockMinimo})
        }
        await Articulos.update({id:id},datos);
        return res.redirect(`/almacen/articulos/${id}`);
    },
    nuevoMovimiento:async function(req,res){
        let datos=req.body;
        let costoPromedio=0;
        const existe=await StockOficina.findOne({articulo:datos.articulo,oficina:req.oficinaElegida.id})
        if (datos.tipo === "VENTA") {
            if (!existe || existe.cantidad <= 0 || existe.cantidad < datos.cantidad) {
                req.addFlash('mensaje', "No se puede realizar la venta: No hay existencias suficientes en este almacén.");
                return res.redirect(`/almacen/articulos/${datos.articulo}`);
            }
        }

        if (existe) {
            // Lógica para actualizar registro existente
            if (datos.tipo === "COMPRA") {
                costoPromedio = ((existe.costopromedio * existe.cantidad) + (parseFloat(datos.cantidad) * parseFloat(datos.costoAplicado))) / (existe.cantidad + parseFloat(datos.cantidad));
                await StockOficina.updateOne({ id: existe.id })
                    .set({ 
                        cantidad: existe.cantidad + parseFloat(datos.cantidad), 
                        costopromedio: costoPromedio, 
                        ultimoCostoReal: datos.costoAplicado 
                    });
            } 
            else if (datos.tipo === "VENTA") {
                // El costo promedio no suele cambiar en una venta (se mantiene el de la última compra)
                await StockOficina.updateOne({ id: existe.id })
                    .set({ cantidad: existe.cantidad - parseFloat(datos.cantidad),ultimoCostoReal:datos.costoAplicado,costopromedio:costoPromedio });
            }
        } 
        else {
            // Lógica para crear registro nuevo (Solo si es COMPRA por la validación inicial)
            costoPromedio = datos.costoAplicado;
            await StockOficina.create({
                articulo: datos.articulo,
                oficina: req.oficinaElegida.id,
                cantidad: datos.cantidad,
                costopromedio: costoPromedio,
                ultimoCostoReal: datos.costoAplicado,
                stockMinimo: 0 // O el valor por defecto que prefieras
            });
        }

        // Registrar el movimiento en el historial
        datos.oficina=req.oficinaElegida.id
        datos.usuarioResponsable=req.session.usuario.id
        await MovimientoInventario.create(datos);
        
        req.addFlash('mensaje', "Se ha realizado el movimiento de forma exitosa");
        return res.redirect(`/almacen/articulos/${datos.articulo}`);

    },
    nuevoMovimientoSerieOld:async function(req,res){
        console.log(req.body)
        let datos=req.body
        let series = req.body.series || [];
        
        series = series.filter(s => s.trim() !== '');
        if (series.length > 0) {
            datos.cantidad = series.length;
        }
        console.log("series: ",series)
        console.log("Datos: ",datos)
        datos.series=series;
        datos.oficina=req.oficinaElegida.id;
        datos.usuarioResponsable=req.session.usuario.id

        const movimiento = await MovimientoInventario.create(datos).fetch();

        if (series.length > 0) {
            const registrosSeries = series.map(s => ({
                serie: s,
                articulo: datos.articulo,
                oficina: req.oficinaElegida.id,
            }));
            
            // Suponiendo que tienes un modelo llamado 'ArticuloSerie'
            await Serie.createEach(registrosSeries);
        }

        req.addFlash('mensaje', "Se ha realizado el movimiento de forma exitosa");
        return res.redirect(`/almacen/articulos/${datos.articulo}`);
    },
    nuevoMovimientoSerie: async function(req, res) {
        console.log("Datos antes de movimientos",req.body)
        let datos = req.body;
        const idArticulo = req.body.articulo;
        const idOficina = req.oficinaElegida.id;

        //try {
            // 1. Obtener el stock actual para cálculos de costo y validaciones
            const stockActual = await StockOficina.findOne({ articulo: idArticulo, oficina: idOficina });
                if (datos.tipo === 'VENTA') {
                    if (!stockActual || stockActual.cantidad <= 0 || stockActual.cantidad < datos.cantidad) {
                        req.addFlash('mensaje', "No se puede realizar la venta o salida: No hay existencias suficientes en este almacén.");
                        return res.redirect(`/almacen/articulos/${datos.articulo}`);
                    }
                    // 1. Obtener las series seleccionadas desde los checkboxes (serieEliminar)
                    let seriesSeleccionadas = datos.seriesEliminar;
                    if (!Array.isArray(seriesSeleccionadas)) {
                        seriesSeleccionadas = seriesSeleccionadas ? [seriesSeleccionadas] : [];
                    }

                    if (seriesSeleccionadas.length === 0) {
                        req.addFlash('mensaje', "Error: Debe seleccionar al menos una serie para la venta.");
                        return res.redirect(`/almacen/articulos/${idArticulo}`);
                    }
                    let datosSeries=[]
                    // 2. Validar cada serie antes de procesar
                    for (let s of seriesSeleccionadas) {
                        const serieDb = await Series.findOne({ id: s, oficina: idOficina,activo:1 }); // Buscamos por ID del checkbox
                        
                        if (!serieDb) {
                            req.addFlash('mensaje', "Una de las series seleccionadas no existe.");
                            return res.redirect(`/almacen/articulos/${idArticulo}`);
                        }
                        if (serieDb.usado === 'INSTALADA') {
                            req.addFlash('mensaje', `La serie ${serieDb.serie} está INSTALADA. Debe devolverla al almacén primero.`);
                            return res.redirect(`/almacen/articulos/${idArticulo}`);
                        }
                        if (serieDb) {
                            datosSeries.push({id:serieDb.id,serie:serieDb.serie})
                        }
                    }
                    // 3. Procesar salida: Desactivar y cambiar estado
                    await Series.update({ id: seriesSeleccionadas }).set({ usado: 'VENDIDA', activo: 0 });

                    // 4. Actualizar Stock y Datos del Movimiento
                    datos.cantidad = seriesSeleccionadas.length;
                    datos.costoAplicado = stockActual ? stockActual.costopromedio : 0;
                    datos.series=datosSeries;
                    delete datos.seriesEliminar

                    await StockOficina.updateOne({ id: stockActual.id })
                        .set({ cantidad: stockActual.cantidad - datos.cantidad });

                } else if (datos.tipo === 'COMPRA') {
                    // Procesar Compra: Calcular nuevo costo promedio
                    let series = Array.isArray(req.body.series) ? datos.series.filter(s => s.trim() !== '') : [];
                    let costoPromedio=0;
                    let nuevaCantidad = (stockActual ? stockActual.cantidad : 0) + series.length;
                    costoPromedio = datos.costoAplicado;
                    if (series.length === 0) {
                        req.addFlash('mensaje', "Error: Debe ingresar al menos una serie para la compra.");
                        return res.redirect(`/almacen/articulos/${idArticulo}`);
                    }
                    // 2. VALIDAR SI LAS SERIES YA EXISTEN (Con populate para saber dónde están)
                    const seriesExistentes = await Series.find({ serie: series,usado: ['DISPONIBLE', 'INSTALADA']  })
                        .populate('articulo')
                        .populate('oficina');

                    if (seriesExistentes.length > 0) {
                        // Construimos un mensaje detallado con la ubicación de las series encontradas
                        console.log("serie: ",seriesExistentes)
                        let detalleErrores = seriesExistentes.map(s => 
                            
                            `Serie [${s.serie}] ya existe en Artículo: ${s.articulo.codigo} (Oficina: ${s.oficina.nombre}) con un estado de ${s.usado}`
                        ).join('<br>');

                        req.addFlash('mensaje', `Error: Las siguientes series ya están registradas:<br>${detalleErrores}`);
                        return res.redirect(`/almacen/articulos/${idArticulo}`);
                    }
                    if (stockActual && nuevaCantidad > 0) {
                        costoPromedio = ((stockActual.costopromedio * stockActual.cantidad) + (parseFloat(datos.costoAplicado) * series.length)) / nuevaCantidad;
                    }

                    if (stockActual) {
                        await StockOficina.updateOne({ id: stockActual.id })
                            .set({ 
                                cantidad: nuevaCantidad, 
                                costopromedio: costoPromedio, 
                                ultimoCostoReal: datos.costoAplicado 
                            });
                    } else {
                        await StockOficina.create({
                            articulo: idArticulo,
                            oficina: idOficina,
                            cantidad: series.length,
                            costopromedio: costoPromedio,
                            ultimoCostoReal: datos.costoAplicado,
                            stockMinimo: 0
                        });
                    }

                    // Registrar nuevas series
                    const registrosSeries = series.map(s => ({
                        serie: s,
                        articulo: idArticulo,
                        oficina: idOficina,
                        usado: 'DISPONIBLE',
                    }));
                    const reSeries = series.map(s => ({
                        serie: s,
                    }));
                    datos.series=reSeries;
                    delete datos.seriesEliminar;
                    await Series.createEach(registrosSeries);
                    datos.cantidad = series.length;
                }
            // Registrar movimiento y finalizar
            datos.oficina = idOficina;
            datos.usuarioResponsable = req.session.usuario.id;
            console.log("Datos despues",datos)
            await MovimientoInventario.create(datos);

            req.addFlash('mensaje', "Movimiento realizado con éxito");
            return res.redirect(`/almacen/articulos/${idArticulo}`);

       /* } catch (err) {
            req.addFlash('mensaje', "Error al procesar el movimiento en las series");
            return res.redirect(`/almacen/articulos/${idArticulo}`);
        }*/
    },
    eliminar:async function (req,res){
        //console.log(req.params)
        await Articulos.update({id:req.params.id},{
        activo: 0
        });
        return res.redirect("/almacen/articulos");
    },
    activar:async function (req,res){
        await Articulos.update({id:req.params.id},{
        activo: 1
        });
        return res.redirect("/almacen/articulos");
    },
    obtener:async function(req,res){
        let data = await Articulos.findOne({ id: req.query.id });
        if (data) {
        res.status(200).send({ data });
        } else {
            res.status(400).send({ error: "No se ha encontrado el Puesto" });
        }
    },
    tabla: async function (req, res) {
        const draw = req.query.draw;
        const start = parseInt(req.query.start); // Offset
        const length = parseInt(req.query.length); // Límite por página
        const search = req.query.search.value;
        let filtro = {};
        if(search){
            filtro = {
                or: [
                    { codigo: { contains: search } },
                    { descripcion: { contains: search } },
                    { marca: { contains: search } },
                    { modelo: { contains: search } },
                    { tipo: { contains: search } }
                ]
            };
        }
        try {
            const [total, filtrados, registros] = await Promise.all([
                Articulos.count(),
                Articulos.count(filtro),
                Articulos.find(filtro).skip(start).limit(length).sort('id ASC')
            ]);
            return res.json({
                draw: draw,
                recordsTotal: total,
                recordsFiltered: filtrados,
                data: registros
            });
        } catch (err) {
            return res.serverError(err);
        }
    },
    obtenerSeries:async function(req,res){
        let data = await Series.find({ articulo: req.query.id,oficina:req.oficinaElegida.id,activo:1 });
        if (data) {
            res.status(200).send({ data });
        } else {
            res.status(400).send({ error: "No se ha encontrado el Puesto" });
        }
    },
    //Movimientos
    movimientos:async function(req,res){
        let articulo={};
        if(req.params.id){
            articulo=await Articulos.findOne({id:req.params.id});
        }
        let almacenes=await Oficinas.findOne({id:req.oficinaElegida.id}).populate('user',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
        almacenes.user.push({id:req.oficinaElegida.id+"-Oficina",nombre:req.oficinaElegida.nombre})
        return res.view("pages/almacen/movimientos",{articulo,almacenes:almacenes.user});
    },
    articulosMovBuscar:async function(req,res){
       //let articulos=await Articulos.findOne({codigo:req.body.articulos});
        Articulos.find({
            where: { codigo: { contains: req.query.articulos }},
            limit: 10,
            sort: 'codigo ASC'
        }, function (err, articulo) {
            if (err) {
                res.status(500).send({ err });
                //res.send(500,{error:"DB Error"})
            }
            else if (!articulo) {
                res.status(400).send({ error: "No se ha encontrado ninguna artículo" });
            } else {
                res.status(200).send({ articulo });
            }
        });
    },
    tablaMovimientos: async function (req, res) {
        const draw = req.query.draw;
        const start = parseInt(req.query.start); // Offset
        const length = parseInt(req.query.length); // Límite por página
        const search = req.query.search.value;
        let filtro = {};
        let almacen=req.query.idAlmacen.split("-")
        let idAlmacen=almacen[0]

        filtro.oficina=req.oficinaElegida.id
        if(almacen[1]){
            filtro.oficina=idAlmacen
            filtro.usuarioAsignado=null
        }else{
            if(idAlmacen!="Todos"){
                filtro.usuarioAsignado=idAlmacen
            }
        }
        if(req.query.idArticulo!=''){
            filtro.articulo=req.query.idArticulo
        }
        else{
            if(search){
                const articulosCoincidentes = await Articulos.find({
                    where: {
                        or: [
                            { codigo: { contains: search } },
                            { descripcion: { contains: search } }
                        ]
                    },
                    select: ['id']
                });
                const idsArticulos = articulosCoincidentes.map(a => a.id);
                if (idsArticulos.length > 0) {
                    filtro.articulo = idsArticulos; 
                } else {
                    filtro.articulo = 0;
                }
            }
        }
        if (req.query.fechaInicio || req.query.fechaFin) {
            filtro.fecha = {};
            if (req.query.fechaInicio) { filtro.fecha['>='] = new Date(req.query.fechaInicio ).toISOString(); }
            if (req.query.fechaFin) { filtro.fecha['<='] = new Date(req.query.fechaFin + ' 23:59:59').toISOString(); }
        }
        
        try {
            const [total, filtrados, registros] = await Promise.all([
                MovimientoInventario.count({oficina:req.oficinaElegida.id}),
                MovimientoInventario.count(filtro),
                MovimientoInventario.find(filtro).skip(start).limit(length).sort('createdAt DESC')
                .populate('articulo')
                .populate('oficina')
                .populate('usuarioResponsable')
                .populate('usuarioAsignado')
            ]);
            console.log("------------------------------------------------------------------------")
            console.log(registros)
            return res.json({
                draw: draw,
                recordsTotal: total,
                recordsFiltered: filtrados,
                data: registros
            });
        } catch (err) {
            return res.serverError(err);
        }
    },
    //Stock
    stock:async function(req,res){
        let almacenes=await Oficinas.findOne({id:req.oficinaElegida.id}).populate('user',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
        almacenes.user.push({id:req.oficinaElegida.id+"-Oficina",nombre:req.oficinaElegida.nombre})
       
        return res.view("pages/almacen/stock",{almacenes:almacenes.user});
    },
    tablaStock:async function (req,res){
        const draw = req.query.draw;
        const start = parseInt(req.query.start); // Offset
        const length = parseInt(req.query.length); // Límite por página
        const search = req.query.search.value;

        let almacen=req.query.idAlmacen.split("-")
        let idAlmacen=almacen[0]
        let filtro={}
        let filtroGlobal={}
        if(almacen[1]){
             filtro={oficina:req.oficinaElegida.id}
        }else{
            if(idAlmacen=="Todos"){
                 filtro={oficina:req.oficinaElegida.id}
            }else{
                filtro={oficina:req.oficinaElegida.id,usuario:idAlmacen}
            }
        }
        if(req.query.idArticulo!=""){
            filtroGlobal.id=req.query.idArticulo
        }
        if(search){
            filtroGlobal.or= [
                { codigo: { contains: search } },
                { descripcion: { contains: search } }
            ]
        }
        try {
            const [total, articulos] = await Promise.all([
                Articulos.count(),
                Articulos.find(filtroGlobal).skip(start).limit(length).sort('codigo ASC')
                .populate('existenciasOficinas', { where: { oficina: req.oficinaElegida.id } })
                .populate('existenciasUsuarios', { where: filtro })
            ]);
            /*let articulos = await Articulos.find({filtroGlobal})
                .populate('existenciasOficinas', { where: { oficina: req.oficinaElegida.id } })
                .populate('existenciasUsuarios', { where: filtro });*/
            let resultado = articulos.map(art => {
                let cantOficina = art.existenciasOficinas.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                let cantUsuarios = art.existenciasUsuarios.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                let stockTotal=0;
                if(almacen[1]){
                    stockTotal = cantOficina;
                }else{
                    if(idAlmacen=="Todos"){
                        stockTotal = cantOficina + cantUsuarios;
                    }else{
                        stockTotal = cantUsuarios;
                    }
                }
                let costoProm=0
                if(art.existenciasOficinas[0]){
                    costoProm = art.existenciasOficinas[0].costopromedio;
                }
                
                let valorTotalPesos = stockTotal * costoProm;
                return {
                    id: art.id,
                    codigo: art.codigo,
                    descripcion: art.descripcion,
                    marca: art.marca,
                    stock: stockTotal,
                    costoPromedio: costoProm,
                    totalPesos: valorTotalPesos
                };
            }).filter(art => art.stock > 0);
            
            return res.json({
                draw: draw,
                recordsTotal: total,
                recordsFiltered: resultado.length,
                data: resultado
            });
        } catch (err) {
            return res.serverError(err);
        }
    },
    //Transferencia entre almacenes
    transferencia:async function(req,res){
        let almacenes=await Oficinas.findOne({id:req.oficinaElegida.id}).populate('user',{select:['id','nombre'],where:{activo:1},sort:'nombre ASC'})
        almacenes.user.push({id:req.oficinaElegida.id+"-Oficina",nombre:req.oficinaElegida.nombre})
        let origen=req.oficinaElegida.id+"-Oficina"
        let destino=req.session.usuario.id
        if(req.body){
            if(req.body.origen){
                origen=req.body.origen
                destino=req.body.destino
            }
        }
        try {
            let almacenOrigen=origen.toString().split("-")
            let idAlmacenOrigen=almacenOrigen[0]
            let almacenDestino=destino.toString().split("-")
            let idAlmacenDestino=almacenDestino[0]
            
            if(almacenOrigen[1]){
                const articulos=await Articulos.find({tipo:{'!=':'EQUIPO'}}).sort('codigo ASC').populate('existenciasOficinas',{where:{oficina:idAlmacenOrigen}})
                
                let result=await Promise.all(articulos.map(async art=>{
                    
                    if(almacenDestino[1]){
                        idAlmacenDestino=req.session.usuario.id
                    }
                    let stockDestino=await Articulos.findOne({id:art.id}).populate('existenciasUsuarios',{where:{oficina:idAlmacenOrigen,usuario:idAlmacenDestino}})
                    return {
                        id: art.id,
                        codigo: art.codigo,
                        descripcion: art.descripcion,
                        marca: art.marca,
                        // Validamos que exista el índice 0 antes de pedir la cantidad
                        stockOrigen: (art.existenciasOficinas && art.existenciasOficinas[0]) ? art.existenciasOficinas[0].cantidad : 0,
                        stockDestino: (stockDestino.existenciasUsuarios && stockDestino.existenciasUsuarios[0]) ? stockDestino.existenciasUsuarios[0].cantidad : 0,
                        costoPromedio: (art.existenciasOficinas && art.existenciasOficinas[0]) ? art.existenciasOficinas[0].costopromedio : 0,
                    }
                }))
                let resultado=result.filter(art => art.stockOrigen > 0);
                return res.view("pages/almacen/transferencia",{almacenes:almacenes.user,resultado,origen,destino});
            }else{
                const articulos=await Articulos.find().sort('codigo ASC').populate('existenciasUsuarios',{where:{oficina:req.oficinaElegida.id,usuario:idAlmacenOrigen}}).populate('existenciasOficinas',{oficina:almacenDestino[0]})
                let result=await Promise.all(articulos.map(async art=>{
                    console.log("AlmacenDestino:",almacenDestino,almacenDestino[1])
                    if(almacenDestino[1]){
                        let stockDestino=await Articulos.find({id:art.id}).populate('existenciasOficinas',{where:{oficina:req.oficinaElegida.id}})

                        return {
                            id: art.id,
                            codigo: art.codigo,
                            descripcion: art.descripcion,
                            marca: art.marca,
                            stockOrigen: (art.existenciasUsuarios && art.existenciasUsuarios[0]) ? art.existenciasUsuarios[0].cantidad : 0,
                            stockDestino: (art.existenciasOficinas && art.existenciasOficinas[0]) ? art.existenciasOficinas[0].cantidad : 0,
                            costoPromedio: (art.existenciasOficinas && art.existenciasOficinas[0]) ? art.existenciasOficinas[0].costopromedio : 0,
                        }
                    }else{
                        let stockDestino=await Articulos.findOne({id:art.id}).populate('existenciasUsuarios',{where:{oficina:req.oficinaElegida.id,usuario:idAlmacenDestino}})
                        return {
                            id: art.id,
                            codigo: art.codigo,
                            descripcion: art.descripcion,
                            marca: art.marca,
                            stockOrigen: (art.existenciasUsuarios && art.existenciasUsuarios[0]) ? art.existenciasUsuarios[0].cantidad : 0,
                            stockDestino: (stockDestino.existenciasUsuarios && stockDestino.existenciasUsuarios[0]) ? stockDestino.existenciasUsuarios[0].cantidad : 0,
                            costoPromedio: (art.existenciasOficinas && art.existenciasOficinas[0]) ? art.existenciasOficinas[0].costopromedio : 0,
                        }
                    }
                }))
                let resultado=result.filter(art => art.stockOrigen > 0);
                return res.view("pages/almacen/transferencia",{almacenes:almacenes.user,resultado,origen,destino});
            }
        } catch (err) {
            return res.serverError(err);
        }
       
        
    },
    masivo: async function (req, res) {
        const { destino, articulos,origen } = req.allParams(); // articulos = [{id: 1, cantidad: 5}, ...]
        const officeId = req.oficinaElegida.id;
        console.log(req.body)
        let almacenOrigen=origen.toString().split("-")
        let idAlmacenOrigen=almacenOrigen[0]
        let almacenDestino=destino.toString().split("-")
        let idAlmacenDestino=almacenDestino[0]

        //try 
            await sails.getDatastore().transaction(async (db) => {
                for (let item of articulos) {
                    console.log("Dentro del for: ",item)
                // 1. Validar Stock en Bodega (Oficina)
                    let stockOfi;
                    if(almacenOrigen[1]){
                        stockOfi = await StockOficina.findOne({ articulo: item.id, oficina: almacenOrigen[0] }).usingConnection(db);
                        if (!stockOfi || Number(stockOfi.cantidad) < Number(item.cantidad)) {
                            throw new Error(`Stock insuficiente para el artículo ID ${item.id}`);
                        }
                        // 2. Descontar de Bodega
                        await StockOficina.updateOne({ id: stockOfi.id })
                            .set({ cantidad: Number(stockOfi.cantidad) - Number(item.cantidad) })
                            .usingConnection(db);
                    }else{
                        stockOfi = await StockUsuario.findOne({ articulo: item.id, oficina: officeId,usuario:origen }).usingConnection(db);
                        if (!stockOfi || Number(stockOfi.cantidad) < Number(item.cantidad)) {
                            throw new Error(`Stock insuficiente para el artículo ID ${item.id}`);
                        }
                        // 2. Descontar de Bodega
                        await StockUsuario.updateOne({ id: stockOfi.id })
                            .set({ cantidad: Number(stockOfi.cantidad) - Number(item.cantidad) })
                            .usingConnection(db);
                    }
                    if(almacenDestino[1]){
                        // 3. Aumentar/Crear en Almacén de Usuario
                        let stockUsr = await StockOficina.findOne({ 
                            articulo: item.id, oficina: almacenDestino[0] 
                        }).usingConnection(db);

                        if (stockUsr) {
                            await StockOficina.updateOne({ id: stockUsr.id })
                            .set({ cantidad: Number(stockUsr.cantidad) + Number(item.cantidad) })
                            .usingConnection(db);
                        } else {
                            await StockOficina.create({
                                articulo: item.id, oficina: almacenDestino[0],
                                cantidad: item.cantidad, costopromedio: stockOfi.costopromedio
                            }).usingConnection(db);
                        }
                    }else{
                        // 3. Aumentar/Crear en Almacén de Usuario
                        let stockUsr = await StockUsuario.findOne({ 
                            articulo: item.id, usuario: destino, oficina: officeId 
                        }).usingConnection(db);

                        if (stockUsr) {
                            await StockUsuario.updateOne({ id: stockUsr.id })
                                .set({ cantidad: Number(stockUsr.cantidad) + Number(item.cantidad),costopromedio:stockOfi.costopromedio })
                                .usingConnection(db);
                        } else {
                            await StockUsuario.create({
                                articulo: item.id, usuario: destino, oficina: officeId,
                                cantidad: item.cantidad, costopromedio: stockOfi.costopromedio
                            }).usingConnection(db);
                        }
                    }
                    

                    // 4. Registrar Movimiento (Auditoría)
                    let usuarioOrigen=origen;
                    let usuarioDestino=destino;
                    if(almacenOrigen[1]){
                        usuarioOrigen=null
                    }
                    if(almacenDestino[1]){
                        usuarioDestino=null
                    }
                    await MovimientoInventario.create({
                            tipo: 'TRANSFERENCIA',
                            cantidad: item.cantidad,
                            articulo: item.id,
                            oficina: officeId,
                            usuarioResponsable: req.session.usuario.id,
                            usuarioAsignado: usuarioOrigen,
                            costoAplicado:stockOfi.costopromedio,
                            concepto: 'Salida por Transferencia Masiva'
                        }).usingConnection(db);
                    await MovimientoInventario.create({
                            tipo: 'TRANSFERENCIA',
                            cantidad: item.cantidad,
                            articulo: item.id,
                            oficina: officeId,
                            usuarioResponsable: req.session.usuario.id,
                            usuarioAsignado: usuarioDestino,
                            costoAplicado:stockOfi.costopromedio,
                            concepto: 'Entrada por Transferencia Masiva'
                        }).usingConnection(db);
                    
                }
            });
            return res.ok();
        /*} catch (err) {
            return res.status(400).send(err.message);
        }*/
    },
    //Para series en equipos
    buscarSeries:async function(req,res){
        let series=await Series.find({
                where: { serie: { contains: req.query.numero },activo:1,usado:'DISPONIBLE',oficina:req.query.oficina},
                limit: 10,
                sort: 'serie ASC'
        }).populate('articulo');
        if(series){
            res.status(200).send({ series,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ninguna serie" });
        }
    },
    compras:async function(req,res){
        return res.view("pages/almacen/compras");
    },
    buscarArticulos:async function(req,res){
        let articulos=await Articulos.find({tipo:{'!=':'EQUIPO'},codigo: { contains: req.query.nombre }})
        if(articulos){
            res.status(200).send({ articulos,resp:1 });
        }else{
            res.status(400).send({ error: "No se ha encontrado ningun artículo" });
        }
    },
    agregarCompra:async function(req,res){
        let fecha=req.body.fecha
        let concepto=req.body.concepto
        let articulos=req.body.articulos
        let datos={
            fecha:fecha,
            concepto:concepto,
            tipo:"COMPRA",
            usuarioResponsable:req.session.usuario.id,
            oficina:req.oficinaElegida.id
        }
        // 1. Extraer todos los IDs de artículos para buscarlos de golpe
        const articulosIds = articulos.map(a => a.id);
        await sails.getDatastore().transaction(async (db) => {
            // 2. Buscar todo el stock existente en una sola consulta
            const stocksExistentes = await StockOficina.find({
                articulo: articulosIds,
                oficina: req.oficinaElegida.id
            }).usingConnection(db);

            // Convertir a un mapa/diccionario para acceso rápido por ID de artículo
            const stockMap = {};
            stocksExistentes.forEach(s => { stockMap[s.articulo] = s; });

            let actualizacionesStock = [];
            let nuevosStocks = [];
            let movimientosParaCrear = [];

            // 3. Procesar lógica en memoria (sin tocar la DB aún)
            for (const a of articulos) {
                const existe = stockMap[a.id];
                let costoPromedio;

                if (existe) {
                    costoPromedio = ((existe.costopromedio * existe.cantidad) + (parseFloat(a.cantidad) * parseFloat(a.costo))) / (existe.cantidad + parseFloat(a.cantidad));
                    
                    await StockOficina.updateOne({ id: existe.id })
                    .set({
                        cantidad: existe.cantidad + parseFloat(a.cantidad),
                        costopromedio: costoPromedio,
                        ultimoCostoReal: a.costo
                    })
                    .usingConnection(db);
                } else {
                    // Guardamos los datos para crear después
                    nuevosStocks.push({
                        articulo: a.id,
                        oficina: req.oficinaElegida.id,
                        cantidad: parseFloat(a.cantidad),
                        costopromedio: parseFloat(a.costo),
                        ultimoCostoReal: parseFloat(a.costo),
                        stockMinimo: 0
                    });
                }

                // Preparar el movimiento de inventario
                movimientosParaCrear.push({
                    ...datos, // Copia de los datos base
                    articulo: a.id,
                    costoAplicado: a.costo,
                    cantidad: a.cantidad
                });
            }
            // 4. Ejecutar inserciones masivas DENTRO de la transacción
            if (nuevosStocks.length > 0) {
                await StockOficina.createEach(nuevosStocks).usingConnection(db);
            }

            if (movimientosParaCrear.length > 0) {
                await MovimientoInventario.createEach(movimientosParaCrear).usingConnection(db);
            }
        });
        return res.ok({ message: 'Compra agregada correctamente' });
    },
};