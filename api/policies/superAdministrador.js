module.exports = function (req, res, next) {
    
    try{
        if(req.session.usuario.role=="SuperAdministrador"){
            return next();
        }
        else{
            req.addFlash('mensaje', 'Para entrar a esta página debes ser SuperAdministrador');
            res.redirect('/');
        }
    }
    catch{
        req.addFlash('mensaje', 'Para entrar a esta página debes ser SuperAdministrador');
        res.redirect('/');
    }

};