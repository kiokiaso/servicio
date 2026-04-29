module.exports = function (req, res, proceed) {
  // Anulamos la función save para esta petición específica
  // Esto permite leer la sesión pero impide que Sails la "pise" al terminar
  req.session.save = function(cb) {
    if (cb) return cb();
  };
  return proceed();
};
