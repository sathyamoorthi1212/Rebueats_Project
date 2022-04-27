const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express();
const jwt = require('jsonwebtoken');
const Config = require('config');
const chalk = require('chalk');
const boom = require('express-boom');
const i18n2 = require('i18n-2');
const cookieParser = require('cookie-parser');
const logger = require('./services/logger');
const HttpStatus = require('http-status-codes');
const GraphQLSchema = require('./graphql');
const expressGraphQL = require('express-graphql');
const path = require('path');
const morgan = require("morgan");

/*Server host port from Config*/
const port = Config.server.port;
const port1 = 3000;

const passportAuth = passport.authenticate("jwt", { session: false });

/*Database connection*/
require('./config/mongoose');
//require('./config/socketIo');
//const server = require('http').createServer(app);
//global.io = require('socket.io').listen(server.listen(port1));
//var socketio=require('./config/socket');
app.set('socketio', global.io);


/*Authorization init and check */
app.use(passport.initialize());
require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());
app.use(function (req, res, next) {
  console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhh", req.headers['uuid']);
  //console.log("checksssssssssssssssssssssssssssssssssssssssssss",req.headers.uuid)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  //  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  //  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('access-control-expose-headers', 'x-total-count');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization,uuid");

  // allow preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(HttpStatus.OK);
  } else {
    next();
  }
});

/*Multi Language Response*/
i18n2.expressBind(app, {
  locales: ['en', 'tam', 'es'],
  cookieName: 'locale',
  extension: ".json"
});
app.use(function (req, res, next) {
  if (req.headers['accept-language']) {
    let language = (req.headers['accept-language']) ? req.headers['accept-language'] : 'en';
    req.i18n.setLocale(language);
  } else {
    req.i18n.setLocale("en");
  }

  next();
})

app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, 'assets')));

/*Graphql Implementation*/
app.use('/graphql', expressGraphQL(req => ({
  schema: GraphQLSchema,
  context: req.context,
  graphiql: true
})
));

/*Router*/
app.use('/api/admin', require('./router/AdminRoutes'));
app.use('/api/user', require('./router/UserRoutes'));
app.use('/api/driver', require('./router/DriverRoutes'));
app.use('/api/partner', require('./router/PartnerRoutes'));
app.use('/api/', require('./router/RestaurantRoutes'));

/*app.use('/assets',function(req,res){
  res.sendFile(__dirname+req.originalUrl)
})*/
app.get('/', (req, res) => {
  //return res.end('Api is Working');
  return res.status(HttpStatus.OK).send("Api working");
})

app.use(express.static(path.join(__dirname, 'assets/images')));

/*Error Handler using Validation*/
app.use(function (req, res) {

  return res.status(HttpStatus.NOT_FOUND).send(req.i18n.__("INVALID_REQUEST"));

});

/*app.use(function(err, req, res, next){
//console.log("")
res.send(err);
  
  //res.status(HttpStatus.NOT_FOUND).json({'success': false, 'message':req.i18n.__(err.errors[0].messages[0])});
});
*/
app.use((err, req, res, next) => {
  console.log("server", err)

  const error = {
    message: err.message || 'Internal Server Error.',
  };

  if (err.errors) {
    error.errors = {};
    const { errors } = err;
    if (Array.isArray(errors)) {
      error.errors = errors.reduce((obj, error) => {
        console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", req.i18n.__(error.messages[0]))

        const nObj = obj;
        nObj[error.field] = req.i18n.__(error.messages[0]).replace(/"/g, '');
        return nObj;
      }, {})
    } else {
      Object.keys(errors).forEach(key => {
        error.errors[key] = errors[key].mesages;
      });
    }
  }

  if (!err.status) err.status = 500;
  if (err.status == 400 && err.message == 'validation error') {
    var errorString = '';
    err.errors.forEach(key => {
      if (errorString == '') {
        errorString = (key.messages[0].replace(/"/g, ''))//.replace(/"/g, '');
      }

      else
        errorString += ',' + (key.messages[0]).replace(/"/g, '');
    })
    console.log("dddddddddddddd", req.i18n.__(errorString))
    err.message = (req.i18n.__(errorString));
  }


  res.status(err.status).json({
    success: false,
    message: (err.message).toString(),
    data: error.errors
  });
});






/*Server Start or Listen*/
app.listen(port, () => {
  console.log(chalk.cyanBright(`Server running at: ${(Config.server).uri}`));

});