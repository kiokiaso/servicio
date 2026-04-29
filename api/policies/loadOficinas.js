module.exports = async function (req, res, proceed) {
  // Si no hay usuario logueado, saltamos
  if (!req.session.usuario) return proceed();

  // Si ya tenemos la oficina en esta petición, no hacemos nada
  if (res.locals.oficina) return proceed();

  try {
    // Usamos el ID guardado en sesión para traer el objeto completo de la BD
    // Esto solo ocurre UNA vez por cada F5 o cambio de página
    const user = await User.findOne({ id: req.session.usuario.id }).populate('oficinaActual');
    
    if (user && user.oficinaActual) {
      res.locals.oficinaElegida = user.oficinaActual; // Disponible en todas las vistas EJS
      req.oficinaElegida = user.oficinaActual;       // Disponible en todos los controladores
    }
    
    return proceed();
  } catch (err) {
    return proceed(); // O manejar error
  }
};
