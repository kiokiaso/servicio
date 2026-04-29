module.exports = {
  index: async function (req, res) {
   console.log("ID en Sesión al cargar / :", req.session.oficina ? req.session.oficina.id : 'No hay');


    //let menu = await sails.helpers.menuBuilder(req.session.usuario.id);
    console.log("Datos del socket")
    var socketIp = sails.sockets.getId(req);
    console.log(socketIp)
    console.log('Sesión de la oficina',req.session.oficina)
    console.log('Oficina elegida: ',req.session.oficinaElegida)

    return res.view("pages/homepage");
  },

  homeOri: async function (req, res) {
    let usuario = await Usuario.findOne({
      id: req.session.passport.user.id,
    }).populate("oficina");
    let calendario = await Calendario.count({ usuario: usuario.id });
    let calendar = "";
    if (calendario == 0) {
      calendar = "";
    } else {
      calendar = "";
      //calendar=await Calendario.findOne({usuario:usuario.id});
      //calendario=calendario.dashboard;
    }
    //console.log(calendario);
    //MANEJO DE SESSIONES DE PERMISOS
    req.session.usuario = usuario;
    if (
      usuario.role == "SuperAdministrador" ||
      usuario.role == "Administrador"
    ) {
      req.session.usuario.permiso = "TotalAccess";
    }
    if (
      usuario.role == "Gerente" ||
      usuario.role == "Gerente General" ||
      usuario.role == "Direccion" ||
      usuario.role == "Gerente Ventas"
    ) {
      req.session.usuario.permiso = "All";
    }
    if (usuario.role == "Vendedor") {
      req.session.usuario.permiso = "Ventas";
    }
    if (usuario.role == "Almacen") {
      req.session.usuario.permiso = "Almacen";
    }
    if (usuario.role == "Credito") {
      req.session.usuario.permiso = "Credito";
    }
    if (usuario.role == "Contador General") {
      req.session.usuario.permiso = "ContadorGeneral";
    }

    req.session.version = await VersionesHistorico.find({
      limit: 1,
      sort: [{ createdAt: "DESC" }],
    });
    let time = 1654643121991;
    var date = new Date(time);
    console.log(date.toString());
    let movimientos = [];

    if (
      req.session.usuario.role == "SuperAdministrador" ||
      req.session.usuario.role == "Administrador" ||
      req.session.usuario.role == "Direccion" ||
      req.session.usuario.role == "Gerente Ventas"
    ) {
      movimientos = await PostVenta.find({
        where: { descripcion: "Venta Creada" },
        limit: 10,
        sort: [{ createdAt: "DESC" }],
      }).populate("usuario");
    } else if (req.session.usuario.role == "Vendedor") {
      movimientos = await PostVenta.find({
        where: { usuario: req.session.usuario.id, descripcion: "Venta Creada" },
        limit: 10,
        sort: [{ createdAt: "DESC" }],
      }).populate("usuario");
      //movimientos=await Seguimiento.find({usuario:req.session.usuario.id,descripcion:'Venta creada'}).populate('usuario');
    } else if (
      req.session.usuario.role == "Gerente" ||
      req.session.usuario.role == "Gerente General"
    ) {
      let contador = await Gerentes.count({ usuario: req.session.usuario.id });
      if (contador > 0) {
        let oficinasGerente = await Gerentes.find({
          usuario: req.session.usuario.id,
        });
        let where = [];
        for (let i = 0; i < oficinasGerente.length; i++) {
          let usuario = await Usuario.find({
            activo: 1,
            oficina: oficinasGerente[i].oficina,
          });
          for (let j = 0; j < usuario.length; j++) {
            let cadena = await PostVenta.find({
              where: { usuario: usuario[j].id, descripcion: "Venta Creada" },
              limit: 10,
              sort: [{ createdAt: "DESC" }],
            }).populate("usuario");
            Array.prototype.push.apply(movimientos, cadena);
          }
        }
        await movimientos.sort(function (a, b) {
          if (a.createdAt.getTime() / 1000 < b.createdAt.getTime() / 1000) {
            return 1;
          }
          if (a.createdAt.getTime() / 1000 > b.createdAt.getTime() / 1000) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });
      } else {
        movimientos = await Seguimiento.find({
          where: {
            usuario: req.session.usuario.id,
            descripcion: "Prospecto creado",
          },
          limit: 10,
          sort: [{ createdAt: "DESC" }],
        }).populate("usuario");
      }
    }
    //console.log(movimientos);
    await Actividades.create({
      titulo: "Dashboard",
      contenido: "Dashboard",
      ruta: "/",
      tipo: "Dashboard",
      controlador: "DashboardController",
      agente: "Ip:" + req.ip + " - Agente:" + req.headers["user-agent"],
      usuario: req.session.usuario.id,
    });
    console.log(calendar);
    res.view("pages/homepage", { movimientos, calendar });
  },
};
