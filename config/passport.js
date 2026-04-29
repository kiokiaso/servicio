/*const passport = require("passport");
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
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        let user = await User.findOne({ email });

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

module.exports = passport;*/

/*const passport = require('passport'),
LocalStrategy = require('passport-local').Strategy,
bcrypt = require('bcryptjs');

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.nombre });
      });
});
passport.deserializeUser(function(id, cb){
    process.nextTick(function() {
        Usuario.findOne({id}, function(err, user) {
            cb(err, user, {message: 'Usuario no encontrado'});
        });
    });
    
});
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'contrasena'
    }, function(username, password, cb){
    Usuario.findOne({email: username,activo:1}, function(err, user){
        if(err) {
            return cb(err);
        }
        if(!user) {
            return cb(null, false, {message: 'Usuario no encontrado'});
        }
        bcrypt.compare(password, user.contrasena, function(err, res){
            if(!res) return cb(null, false, { message: 'Contraseña invalida' });
            return cb(null, user, { message: 'Login Succesful'});
        });
    });
}));*/
