var Path = require('path');
var ip = require('ip');
var chalk = require('chalk');

module.exports = {
   server: {
      host: ip.address(),
      port: 3003,
      protocol: 'http',
      uri: `http://${ip.address()}:3003`,
   },
   database: {
      host: 'localhost',
      port: 27017,
      dbname: 'rebueats'
   },
   error_code: {
      success: 200,
      bad_request: 400,
      unauthorized: 401,
      forbidden: 403,
      not_found: 404
   },
   CHALK_ERROR: chalk.bold.red,
   CHALK_LOG: chalk.bold.blue,
   API_SECRET: 'secretfortaskworld',
   SmsClientMobie: '+1 201 685 3103',
   SmsAccountId: 'AC09805bd18cc682a73c0c64ade2bcbc78',
   SmsAccountToken: '1a1f72f11e25fb0fb23cf5ad8f1e54cb',
   CountryCode: '+91',
   RadiusLimit: 5000,
   SmsContent: 'Your RebuEats code is ',
   SmsPassword: 'Your Reset Password is ',
   SmsRegister: 'User OTP Registered SuccessFully ',
   Verification: 'User OTP Verified SuccessFully ',
   resend: 'Resended OTP is ',
   TOKEN: {
      EXPIRE: '24h'
   },
   Subject: {
      registration: 'OTP Registration',
      password: 'Account Password changed',
      resend: 'OTP Resend',
      Verification: 'OTP Verification',
   },
   Mail: {
      host: 'smtp.gmail.com',
      port: 465,
      userName: 'abservetech.smtp@gmail.com',
      password: 'smtp@345',
      fromMail: '"Admin " <abservetech.smtp@gmail.com>',
      registration: 'Registration OTP'
   },
   notificationContentType: {
      registrationOTP: 1,
      successRegistration: 2,
      forgotPassword: 3,
      changePassword: 4,
      resendOTP:5,
   },
   "firebasekey": {
      /*"appName": "rebustar",
      "serviceAccount": "service-account.json",
      "authDomain": "rebustar-d96c1.firebaseapp.com",
      "databaseURL": "https://rebustar-d96c1.firebaseio.com/",
      "storageBucket": "rebustar-d96c1.appspot.com"*/
      /*authDomain: "rebueats-b0469.firebaseapp.com",
      databaseURL: "https://rebueats-b0469.firebaseio.com",
      projectId: "rebueats-b0469",
      storageBucket: "rebueats-b0469.appspot.com",
      messagingSenderId: "1006382117426",
      appName: "RebuEats",
      appId: "1:1006382117426:web:c49d4cbdd280caf9"*/
      apiKey: "AIzaSyDmcibP05nt9oVsTbwHXM8o9o3NMpfgC40",
      authDomain: "fir-93613.firebaseio.com",
      databaseURL: "https://fir-93613.firebaseio.com",
      projectId: "fir-93613",
      storageBucket: "fir-93613.appspot.com",
      messagingSenderId: "639300568398",
      appId: "1:639300568398:android:143c81cc085d267d"
   },
}
