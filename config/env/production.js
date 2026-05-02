
module.exports = {
  datastores: {
    default: {
      adapter: 'sails-mysql',
      url: 'mysql://root:root@localhost:8889/servicio',
      //url: 'mysql://servicio:X&k_gfBS7vq8hl8s@localhost:3306/servicio',
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

/*
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCfwOOK0zRZnloj133m7yc0u2d02IOXy1EKnQGHwXfyHrv0wIdPcS3ABW+q4gBNMWLrGSsqcFi3XVGX7QDkRMhYvJZA3P5/UOnXzidpvaqx9jClakV63fVAYceYLSYMP1cJHZ+lSHHEl7eBz+ZpUAdU1orpdMOIsJ/QR/f2UdTlpCxbUl4sBzIRIrVeRF/BpErAcNxxsmzVr1FB8j8sIB666Zhq1BDkvPNRRQiYXHaHpdttEiJTSH8pmw+yIN3Bo7eWbZBP64tpHyocLmj3RiC5vWoW7iiksGnS6dehCOlN3g/HVPo8ptKc5eF6MDDRPbI2sS2W8ZVXk6UGOkADamEYLN9iJUYhf3PhZH1KKu/SC2qcOj/GFkfJxxvR3J6D6msmyq3P14TlxYFzUOh7YsYRI5Q3CavLwljPnEQKF2QKYTtvgkuhoVncG3jfGu6KLcrUOyPWiN4qVMUMI36WZ98XOxM19Mc+9aIit4PdfqXPMOAnpNj5LHtec87Q1VY2n5LP6RdREiUX+fXP1Z7Gey2j61iPcxtsHjqe2QC6mmeYODlUnFLHDn0EH/FPytn9ZePBTnkybbr5NBDstOPg6KOK+lW8GFl/jad+qJ5VZIi+9dth0etJ3NqO6qrtDeCWgXO/r4Mt71FOW4PKhxWCYSdtlbeXiByJayVkANj01/xPrQ==



X&k_gfBS7vq8hl8s

PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
*/
