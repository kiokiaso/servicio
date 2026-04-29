module.exports = async function (req, res, proceed) {
    //sails.log.debug(`Ruta: ${req.url} | SessionID: ${req.sessionID}`);
    if (!req.session || !req.session.usuario.id){ 
        return res.unauthorized();  
    }
    if (req.url.match(/\.(png|jpg|jpeg|gif|css|js|ico|svg)$/)) {
        return proceed();
    }
    try{
        const user = await User.findOne(req.session.usuario.id);
        if (!user || user.lastSessionId !== req.sessionID) {
            req.session.usuario.id = null;
                req.addFlash('mensaje', 'Tu sesión se ha abierto en otro dispositivo.');
            //}

            return res.redirect('/login');
        }
        return proceed();
    }catch(err){
        return res.serverError(err);
    }
};