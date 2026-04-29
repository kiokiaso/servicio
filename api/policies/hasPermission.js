/**
Policy que valida permisos
según roles asignados al usuario
*/

module.exports = async function (req, res, proceed) {
  if (!req.session) {
    return proceed();
  }

  const ruta = req.route.path;
  const metodo = req.method.toUpperCase();
  const permisos = req.session.permisos || [];

  const permitido = permisos.some(p => 
    (p.ruta === '*' || p.ruta === ruta) && (p.metodo === '*' || p.metodo === metodo)
  );

  return permitido ? proceed() :  res.redirect(`/non-authorization?ruta=${ruta}&metodo=${metodo}`);/*res.forbidden()*/;
};
