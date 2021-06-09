var Path = require('path');
var chalk = require('chalk');

module.exports = {
   server: {
      host: 'localhost',
      port: 8000,
      protocol: 'http',
      uri: 'http://localhost:8000'
   },
   database: {
      host: 'localhost',
      port: 27017,
      dbname: 'RebuEats'
   },
   error_code: {
      success: 200,
      bad_request: 400,
      unauthorized: 401,
      forbidden: 403,
      not_found: 404
   },
   STATUS: {
      inactive: 1,
      active: 2,
      online: 3,
      offline: 4,
      deleted: 5
   },
   CHALK_ERROR: chalk.bold.red,
   CHALK_LOG: chalk.bold.blue,
   API_SECRET: 'secretfortaskworld',
   SmsClientMobie: '+1 201 685 3103',
   SmsAccountId: 'AC09805bd18cc682a73c0c64ade2bcbc78',
   SmsAccountToken: '1a1f72f11e25fb0fb23cf5ad8f1e54cb',
   CountryCode: '+91',
   RadiusLimit:5000,
   SmsContent: 'Your RebuEats code is ',
   TOKEN: {
      EXPIRE: '24h'
   },
   Mail:{
      host         : 'smtp.gmail.com',
      port         : 465,
      userName     :'abservetech.smtp@gmail.com',
      password     :'smtp@345',
      fromMail     : '"Admin " <abservetech.smtp@gmail.com>',
      registration :'Registration OTP'
   }

}