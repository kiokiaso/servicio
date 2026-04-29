module.exports = function (req, res, next) {
    'use strict';

    // Sockets
    if(req.isSocket)
    {
        if(req.session &&
        req.session.passport &&
        req.session.passport.user)
        {
            return next();
        }

        res.json(401);
    }
    // HTTP
    else
    {
        const date = new Date();
        let fechInicial= new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds());
        let horarioLimite= new Date(date.getFullYear(),date.getMonth(),date.getDate(),22,0,0);
        let horarioInicial= new Date(date.getFullYear(),date.getMonth(),date.getDate(),7,0,0);
        try{
            
            if(req.session.passport.user){
                if(fechInicial>horarioInicial&&fechInicial<horarioLimite){
                    return next();
                }
                else{
                    req.addFlash('mensaje', 'El horario para trabajar en el sistema es de 7am a 9pm todos los días de la semana, fuera de ese horario nadie puede hacer uso del sistema');
                    res.redirect('/login');
                }
            }
        }
        catch{
            req.addFlash('mensaje', 'La sesión no ha sido iniciada');
            res.redirect('/login');
        }
        // If you are using a traditional, server-generated UI then uncomment out this code:
        //res.redirect('/login');
        

        // If you are using a single-page client-side architecture and will login via socket or Ajax, then uncomment out this code:
        /*
        res.status(401);
        res.end();
        */
    }/*
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        return res.redirect('/login');
    }*/
};