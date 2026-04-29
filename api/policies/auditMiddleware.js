/**
Middleware que registra cada acción
*/

module.exports = async function (req, res, proceed) {
  let params = req.allParams() || {};
  if(!req.session || !req.session.usuario.id){
    return proceed();
  }
  try{
    await sails.helpers.audit.with({
      usuario:req.session.usuario.id,
      accion:req.options.action,
      metodo:req.method,
      contenido:params,
      tabla:req.route.path,
      navegador:req.headers["user-agent"],
      ip:req.ip
    });

    return proceed();
  }catch(err){
    return res.serverError(err);
  }
};
