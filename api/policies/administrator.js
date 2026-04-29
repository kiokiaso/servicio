module.exports = function (req, res, next) {
    
        try{
            if(req.session.usuario.role=="Administrador"||req.session.usuario.role=="SuperAdministrador"){
                return next();
            }
            else{
                req.addFlash('mensaje', 'Solo el administrador tiene acceso a esta parte del sistema');
                res.redirect('/');
            }
        }
        catch{
            req.addFlash('mensaje', 'Solo el administrador tiene acceso a esta parte del sistema');
            res.redirect('/');
        }
    
};