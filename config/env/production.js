
module.exports = {
  datastores: {
    default: {
      adapter: 'sails-mysql',
      url: 'mysql://root:root@localhost:8889/servicio',
    },
  },
  models: {
    migrate: 'alter',
  },
  blueprints: {
    shortcuts: false,
  },
  security: {
    cors: {
      // allowOrigins: [
      //   'https://example.com',
      // ]
    },
  },
  session: {
    cookie: {
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    },
  },
  sockets: {
    onlyAllowOrigins: [
      "http://localhost:1337",
      "http://127.0.0.1:1337"
    ],
    grantOrdersToCookie: true,
  },
  log: {
    level: 'debug'
  },
  http: {
    cache: 365.25 * 24 * 60 * 60 * 1000, // One year
  },
  custom: {
    baseUrl: 'https://example.com',
    internalEmailAddress: 'support@example.com',
  },
};
