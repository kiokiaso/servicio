module.exports = async function (req, res, next) {

    //try{
        try{
            if(req.session.passport.user){
                let usuario=await Usuario.findOne({id:req.session.passport.user.id});
                if(usuario.role=="Almacen"||usuario.role=="Gerente"||usuario.role=="Gerente General"||usuario.role=="SuperAdministrador"){
                    return next();
                }
                else{
                    req.addFlash('mensaje', 'Para entrar a esta parte del sistema tu rol debe ser de almacen');
                    res.redirect('/');
                }
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
