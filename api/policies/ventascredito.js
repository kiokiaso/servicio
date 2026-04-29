module.exports = async function (req, res, next) {

    //try{
        try{
            if(req.session.passport.user){
                let usuario=await Usuario.findOne({id:req.session.passport.user.id});
                if(usuario.role=="Vendedor"||usuario.role=="Credito"||usuario.role=="Gerente"||usuario.role=="Gerente General"||usuario.role=="Direccion"||usuario.role=="Gerente Ventas"||usuario.role=="SuperAdministrador"||usuario.role=="Administrador"){
                    return next();
                }
                else{
                    req.addFlash('mensaje', 'Solo los vendedores, almacenistas o puestos superiores tienen acceso a esta página');
                    res.redirect('/');
                }
            }else{
                req.addFlash('mensaje', 'La sesión no ha sido iniciada');
                res.redirect('/login');
            }
        }
        catch{
            req.addFlash('mensaje', 'La sesión no ha sido iniciada');
            res.redirect('/login');
        }

    /*}
    catch{
        req.addFlash('mensaje', 'Tu rol no te da acceso a esta parte del sistema');
        res.redirect('/login');
    }*/

};
