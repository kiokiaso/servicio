/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */
const passport = require('../api/services/PassportService');
//require('./passport'); 
module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    passportInit: (req, res, next) => {
      if (req.session) {
        return require('passport').initialize()(req, res, next);
      }
      return next();
    },
    passportSession: (req, res, next) => {
      if (req.session) {
        return require('passport').session()(req, res, next);
      }
      return next();
    },
   /* passportInit: (req, res, next) => {
      passport.initialize()(req, res, next);
    },
    passportSession: (req, res, next) => {
      passport.session()(req, res, next);
    },*/  
    //passportInit: passport.initialize(),
    //passportSession: passport.session(),
    order:[
      'cookieParser',
      'session',
      'passportInit',
      'passportSession',
      'bodyParser',
      'compress',
      'router',
      'www',
      'favicon'
    ],

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    // order: [
    //   'cookieParser',
    //   'session',
    //   'bodyParser',
    //   'compress',
    //   'poweredBy',
    //   'router',
    //   'www',
    //   'favicon',
    // ],


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

  },

};
