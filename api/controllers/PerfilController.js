const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { session } = require('passport');
function mesObtener(mes){
    let cadena="";
    if(mes==""){
        mes="Enero";
    }
    else if(mes=="Feb"){
        mes="Febrero"
    }
    else if(mes=="Mar"){
        mes="Marzo";
    }
    else if(mes=="Apr"){
        mes="Abril";
    }
    else if(mes=="May"){
        mes="Mayo";
    }
    else if(mes=="Jun"){
        mes="Junio";
    }
    else if(mes=="Jul"){
        mes="Julio";
    }
    else if(mes=="Aug"){
        mes="Agosto";
    }
    else if(mes=="Sep"){
        mes="Septiembre";
    }
    else if(mes=="Oct"){
        mes="Octubre";
    }
    else if(mes=="Nov"){
        mes="Noviembre";
    }
    else if(mes=="Dec"){
        mes="Diciembre";
    }
    else{
        mes=mes;
    }
    return mes;
}
function fecha(valor){
    let cadena=`${valor}`;

        var band=0;
        var hora="";
        var fecha="";
        for(let i=0;i<cadena.length;i++){
            if(cadena[i]==" "){
                band++;
            }
            if(band<4){
                fecha=fecha+cadena[i];
            }
            else if(band==4){
                if(cadena[i]=="G"){
                    band=5;
                }
                if(cadena[i]==" "){

                }
                else if(band==4){
                    hora=hora+cadena[i];
                }
            }
        }
        let bandDos=0;
        var mes="";
        var dia="";
        var anno="";
        for(let i=0;i<fecha.length;i++){
            if(fecha[i]==" "){
                bandDos++;
            }
            else if(bandDos==1){
                mes=mes+fecha[i];
            }
            else if(bandDos==2){
                dia=dia+fecha[i];
            }
            else if(bandDos==3){
                anno=anno+fecha[i];
            }
        }
        fecha_hora=dia +' de '+mesObtener(mes)+' del '+anno+'H'+hora;

        return fecha_hora
}
module.exports = {
    perfil:async function (req, res) {
        const date = new Date();
        let puestos=await Puestos.find({activo:1});
        let detalleUsuario=await DetalleUsuario.findOne({usuario:req.params.usuarioId})
        let usuario= await Usuario.findOne({id:req.params.usuarioId}).populate('oficina').populate('puesto');
        let google= await Google.count({usuario:usuario.id});
        let calendario=await Calendario.count({usuario:usuario.id});
        let calendar=""
        /*if(calendario==0){
          calendar="";
        }
        else{
          calendar=await Calendario.findOne({usuario:usuario.id});
          //calendario=calendario.dashboard;
        }*/
        if(!detalleUsuario){
            detalleUsuario={linkedin:'',educacion:'',domicilio:'',talentos:'',notas:'',fechanacimiento:'',telefono:'',tiposangre:'',sexo:'',departamento:'',nss:'',rfc:'',avisara:'',telefonoavisar:'',alergias:'',createdAt:'',updatedAt:'',usuario:''}
        }
        let fechaBuscar= new Date();
        //let fechaFinal= new Date();
        //let fechaInicial= new Date();
        //fechaBuscar.setDate(fechaBuscar.getDate()-35);
        //fechaInicial.setDate(fechaBuscar.getDate()-fechaBuscar.getDate());
        //fechaFinal.setDate(fechaFinal.getDate());
        let fechaInicial= new Date(fechaBuscar.getFullYear(),fechaBuscar.getMonth(),1,-5,0,0);
        let fechaFinal = new Date(fechaBuscar.getFullYear(),fechaBuscar.getMonth(),fechaBuscar.getDate(), 18, 59, 59)
        console.log(fechaBuscar);
        console.log(fechaFinal);
        fechaBuscar.setDate(fechaBuscar.getDate()-35);
        let seguimientos=await Seguimiento.find({
            where:{
                usuario:req.params.usuarioId,
                descripcion:['Prospecto creado','Oportunidad creada','Venta creada'],
                createdAt:{'>':fechaBuscar}
            },
            sort:[{createdAt:'DESC'}]
        });

        let contadorProspecto=await Prospectos.count({
                usuario:req.params.usuarioId,
                createdAt:{'>':fechaInicial,'<':fechaFinal},
        });
        let contadorOportunidad=await Oportunidades.count({
            where:{
                usuario:req.params.usuarioId,
                createdAt:{'>':fechaInicial,'<':fechaFinal},
            },
        });
        let contadorCliente=await Cliente.count({
            where:{
                usuario:req.params.usuarioId,
                createdAt:{'>':fechaInicial,'<':fechaFinal},
            },
        });
        for(let i=0;i<seguimientos.length;i++){
            let fecha_hora=fecha(seguimientos[i].createdAt);
            seguimientos[i].createdAt=fecha_hora;
        }
        console.log(seguimientos);

        await Actividades.create({titulo:'Perfil',contenido:'Ingreso a perfil',ruta:`/perfil/${req.params.usuarioId}`,tipo:'Perfil',controlador:'PerfilController',agente:'Ip:'+req.ip+' - Agente:'+req.headers['user-agent'],usuario:req.session.usuario.id});
        res.view("pages/perfil/perfil",{usuario,detalleUsuario,puestos,seguimientos,contadorProspecto,contadorOportunidad,contadorCliente,google,calendar});
    },
    modificarPerfil:async function(req,res){
        dataUsuario = {
            nombre: req.body.nombre,
            puesto:req.body.puesto,
            iniciales:req.body.iniciales,
            movil:req.body.movil
        }
        dataDetalleUsuario={
            linkedin:req.body.linkedin,
            educacion:req.body.educacion,
            domicilio:req.body.domicilio,
            talentos:req.body.talentos,
            notas:req.body.notas,
            fechanacimiento:req.body.fechanacimiento,
            tiposangre:req.body.tiposangre,
            sexo:req.body.sexo,
            departamento:req.body.departamento,
            nss:req.body.nss,
            rfc:req.body.rfc,
            avisara:req.body.avisara,
            telefonoavisar:req.body.telefonoavisar,
            alergias:req.body.alergias,
        }
        if(req.body.contrasena!=""){
            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(req.body.contrasena, salt, async function(err, hash){
                    await Usuario.update({id:req.body.usuarioId},{contrasena:hash});
                });
            });
        }
        req.file('foto').upload({}, async (error, archivos) => {
            if (archivos && archivos[0]) {
                let upload_path = archivos[0].fd;
                let ext = path.extname(upload_path);
                var num = '';
                for(let i=0;i<10;i++){
                    num=num+`${Math.floor(Math.random()*(10-0) + 0)}`;
                }
                await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/perfil/${num}${ext}`)));
                await Usuario.update({id:req.body.usuarioId},{avatar:`/images/perfil/${num}${ext}`});
            }
        });
        let detalleUsuario=await DetalleUsuario.findOne({usuario:req.body.usuarioId})
        if(!detalleUsuario){
            dataDetalleUsuario.usuario=parseInt(req.body.usuarioId);
            dataDetalleUsuario.autorizacion=0;
            await DetalleUsuario.create(dataDetalleUsuario);
        }
        else{
            await DetalleUsuario.update({usuario:req.body.usuarioId},dataDetalleUsuario);
        }
        /*let calendar=await Calendario.findOne({usuario:req.body.usuarioId})
        if(!calendar){
            await Calendario.create({dashboard:req.body.calendarDashboard,usuario:req.body.usuarioId});
        }
        else{
            await Calendario.update({usuario:req.body.usuarioId},{dashboard:req.body.calendarDashboard});
        }*/
        await Usuario.update({id:req.body.usuarioId},dataUsuario);
        dataUsuario.detalles=dataDetalleUsuario;

        let userData=await Usuario.findOne({id:req.body.usuarioId});
        if(req.body.contrasenaAplicacion!=""){
            let contadorCorreo=await Correos.count({usuario:req.body.usuarioId});
            if(contadorCorreo==0){
                await Correos.create({cuenta:userData.email,aplicacion:req.body.contrasenaAplicacion,usuario:userData.id});
            }
            else{
                await Correos.update({usuario:userData.id},{aplicacion:req.body.contrasenaAplicacion});
            }
        }
        await Actividades.create({titulo:'Modificación de Perfil',contenido:JSON.stringify(dataUsuario),ruta:'/perfil/modificar-perfil',tipo:'Perfil',controlador:'PerfilController',agente:'IP: '+req.ip+' - Agente: '+req.headers['user-agent'],usuario:req.session.usuario.id});
        req.addFlash('mensaje','Información actualizada correctamente');
        res.redirect('/perfil/'+req.body.usuarioId);

    },
    plantillas:async function (req,res){
      await Actividades.create({titulo:'Perfil',contenido:'Ingreso a plantillas',ruta:`/perfil/configuracion/plantillas/${req.params.usuarioId}`,tipo:'Perfil',controlador:'PerfilController',agente:'Ip:'+req.ip+' - Agente:'+req.headers['user-agent'],usuario:req.session.usuario.id});
      res.view("pages/perfil/plantillas");
    }
};
