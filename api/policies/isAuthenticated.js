/**
Verifica si el usuario inició sesión
*/

module.exports = async function (req, res, proceed) {
  if (!req.session) {
    return proceed();
  }
  
  if (req.session.usuario) {
    if(req.session.usuario.activeConnectios==0)return res.redirect("/login");
    return proceed();
  }

  return res.redirect("/login");
};
