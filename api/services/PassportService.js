const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

passport.serializeUser((user, done) => {
  done(null, user.id );
});

passport.deserializeUser(async (id, done) => {
  try {
    const userId = typeof id === 'object' ? id.id : id;
    let user = await User.findOne({ id });
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "contrasena",
    },
    async (email, password, done) => {
      try {
        let user = await User.findOne({ email,activo:1 });

        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }

        if (user.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date()) {
          return done(null, false, {
            message: "Cuenta bloqueada temporalmente",
          });
        }

        let valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          await User.updateOne({ id: user.id }).set({
            intentosFallidos: user.intentosFallidos + 1,
          });

          if (user.intentosFallidos >= 4) {
            await User.updateOne({ id: user.id }).set({
              bloqueadoHasta: new Date(Date.now() + 15 * 60 * 1000),
              intentosFallidos: 0,
            });
          }

          return done(null, false, { message: "Contraseña incorrecta" });
        }

        await User.updateOne({ id: user.id }).set({
          intentosFallidos: 0,
          ultimoLogin: new Date(),
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

module.exports = passport;