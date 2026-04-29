/**
Construye menú según permisos
*/

module.exports = {
  inputs: {
    id: {
      type: 'number',
    },
  },
  fn: async function (inputs) {
    let user = await User.findOne({ id: inputs.id })
      .populate("roles")
      .populate("roles.permisos");

    let menu = [];

    user.roles.forEach((role) => {
      role.permisos.forEach((p) => {
        menu.push({
          nombre: p.nombre,
          ruta: p.ruta,
        });
      });
    });

    return menu;
  },
};
