const UserRoute = require('express').Router();
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const firebase = require('firebase');
const NodeMailer = require('nodemailer');
const SmtpTransport = require('nodemailer-smtp-transport');
const lodash = require('lodash');
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const Handlebars = require('handlebars');
const _ = require('lodash');
const logger = require('../../services/logger');
const HashService = require('../../services/helper');
const _C = require('../../config/constants');
const DriverModel = require('../../models/Driver');
const SignupDriverValidator = require('../../validators/SignupDriverValidator');
const Setting = require('../../models/Setting');
const NotificationModel = require('../../models/Notification');


var storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if (file.fieldname === "profileImage" || file.fieldname === "profileImage") {
      cb(null, 'assets/images/user');
    }
    if (file.fieldname === "licenseFront" || file.fieldname === "licenseBack" || file.fieldname === "address") {
      cb(null, 'assets/images/document');
    }

    // if (file.fieldname === "address") {
    //   cb(null, 'assets/images/user');
    // }

  },
  filename: (req, file, cb) => {
    var filetypes = /jpeg|jpg|png/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      cb(
        null,
        file.fieldname + '-' + Date.now() + path.extname(file.originalname)
      );
    }
  }
});

var upload = multer({ storage: storage, limits: { fileSize: 500000 } }).any(); // 500000 bytes to 500 Kb

exports.profileUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      var errors = {};
      errors[err.field] = err.message
      return res.status(400).json({ errors })
    }
    else { next(); }
  })
}

/** 
 * Signup Driver
 * url : /api/driver/signup
 * method : POST
 * author : Sathyamoorthi.R
 * body   : name, email, mobile, password, countryCode
*/
exports.signup = async (req, res) => {

  try {

    const { errors, isValid } = SignupDriverValidator(req.body);
    if (!isValid) {
      throw { "error": errors }
    }
    let checkUnique = await DriverModel.findOne({ 'email': req.body.email }).exec();
    if (checkUnique) {
      throw { "error": { "email": req.i18n.__("DRIVER_EMAIL_UNIQUE_ERROR") } }
    }
    let checkUnique1 = await DriverModel.findOne({ 'mobile': req.body.mobile }).exec();
    if (checkUnique1) {
      throw { "error": { "mobile": req.i18n.__("DRIVER_MOBILE_UNIQUE_ERROR") } }
    }
    let newDoc = new DriverModel(req.body);
    newDoc.password = HashService.generateHash(req.body.password);
    let random = Math.floor(100000 + Math.random() * 900000);
    newDoc.verificationCode = random;
    newDoc.driverLocation = {
      type: 'Point',
      coordinates: [
        toRound(req.body.longitude),
        toRound(req.body.latitude)
      ]
    };
    var arr = [];
    var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
    if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
    newDoc.profileImage = (profileImage.length === 0) ? "" : profileImage[0].filename;

    var results = [];
    var licenseFront = lodash.filter(req.files, ['fieldname', 'licenseFront']);
    var data = (licenseFront.length === 0) ? "" : licenseFront[0].fieldname;
    var user = (licenseFront.length === 0) ? "" : licenseFront[0].filename;
    var value = { "name": data, "path": user };
    var licenseBack = lodash.filter(req.files, ['fieldname', 'licenseBack']);
    var data2 = (licenseBack.length === 0) ? "" : licenseBack[0].fieldname;
    var user2 = (licenseBack.length === 0) ? "" : licenseBack[0].filename;
    var value2 = { "name": data2, "path": user2 };
    var address = lodash.filter(req.files, ['fieldname', 'address']);
    var data1 = (address.length === 0) ? "" : address[0].fieldname;
    var user1 = (address.length === 0) ? "" : address[0].filename;
    var data = { "name": data1, "path": user1 }
    results.push(value, data, value2);
    newDoc.documents = results;

    if (licenseBack.length == 0) {

      throw { "error": { "licenseBack": req.i18n.__('LICENSEBACK_REQUIRED') } }

    } else if (licenseFront.length == 0) {

      throw { "error": { "licenseFront": req.i18n.__('LICENSEFRONT_REQUIRED') } }

    } else if (address.length == 0) {

      throw { "error": { "address": req.i18n.__('ADDRESS_REQUIRED') } }

    } else {

      newDoc = await newDoc.save();
    }
    let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
    var getSMSDetails = smsSetting.smsSetting;
    var getSMTPDetails = smsSetting.smtpSetting;
    let condition = {
      'status': _C.status.adminPanel.active, 'notificationContentStatus': _C.status.adminPanel.active,
      'appType': _C.status.app.customer, 'notificationContentType': Config.notificationContentType.registrationOTP
    }
    let notification = await NotificationModel.find(condition).select('_id emailSubject emailContent smsContent notificationContentType notificationType appType pushNotificationContent');
    let notificationType = notification[0].notificationType;
    let emailContent = notification[0].emailContent;
    let smsContent = notification[0].smsContent;
    /*SMS*/
    var value = {
      mobile: req.body.mobile,
      replacementContent: random
    }
    var smsMessage = HashService.sendMessage(value, getSMSDetails, smsContent);

    if (smsMessage) {
      console.log("the message sended");
    } else {
      console.log("error");
    }
    let pushNotificationContent = notification[0].pushNotificationContent;
    if (notification && notification.length > 0) {
      notification = notification[0];
      if (emailContent && notification.emailContent && notification.emailSubject) {
        /*MAIL*/
        let transporter = NodeMailer.createTransport(SmtpTransport({
          host: getSMTPDetails.smtpHost,
          port: getSMTPDetails.smtpPort,
          secureConnection: true,
          auth: {
            user: getSMTPDetails.smtpUsername,
            pass: getSMTPDetails.smtpPassword
          }
        }))
        var getsite = smsSetting.siteInfo;
        var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
        var source = fs.readFileSync(templateDir, 'utf8');
        var template = Handlebars.compile(source);
        var data = {
          "userName": newDoc.userName, "subject": notification.emailSubject,
          "projectName": getsite.siteName, "siteLogo": getsite.siteLogo,
          "replacementsContent": notification.emailContent + random,
          "supportMail": getsite.siteContactEmail,
        };
        var result = template(data);
        let mailOptions = {
          from: getSMTPDetails.smtpUsername,
          to: req.body.email,
          subject: notification.emailSubject,
          text: notification.emailContent + random,
          html: result // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
        });
      }
    }

    if (newDoc && newDoc.length !== 0) {

      var ar = newDoc.documents
      var user = _.map(ar, function (o) {
        return {

          name: o.name ? o.name : "",
          documents: (o.path) ? `http://${Config.server.host}:${Config.server.port}/document/${o.path}` : ""
        }
      })

      let userDetails = {
        _id: newDoc._id,
        userName: newDoc.userName,
        mobile: newDoc.mobile,
        email: newDoc.email,
        profileImage: (newDoc.profileImage) ? (newDoc.profileImage) : "",
        documents: (user.length > 0) ? user : "",
        verificationCode: random
      }
      addDriverToFb(newDoc);

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_DATA_SUCCESS"), 'data': userDetails });
    } else {

      return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    }

  } catch (err) {
    console.log("err", err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
  }
}


function toRound(val) {
  let valToString = val.toString();
  let splitString = valToString.split('.');
  return splitString.length === 1 ? parseFloat(splitString[0]) : parseFloat(splitString[0] + '.' + splitString[1].slice(0, 8))
}

/** 
 * Add To driver details in firebase 
*/
function addDriverToFb(datas) {

  if (!firebase.apps.length) {
    firebase.initializeApp(Config.firebasekey);
  }

  var db = firebase.database();
  var ref = db.ref("drivers");
  var requestData = {
    userName: datas.userName,
    mobile: datas.mobile,
    status: datas.status,
    driverLocation: datas.driverLocation,
    orderStatus: 0,
    profileImage: (datas.profileImage) ? (datas.profileImage) : ""
  };
  var id = datas._id.toString();
  console.log(id)
  var usersRef = ref.child(id);

  usersRef.set(requestData, function (snapshot) {
    // return res.json({'success':true,'message':'Password Updated Successfully', 'snap' :  snapshot});  
    //console.log("addRiderDatatoFb",requestData);
    logger.info(requestData)
  });
}

exports.update = async (req, res) => {
  console.log("", req.body);
  try {
    let checkUnique = await DriverModel.find({ 'email': req.body.email, '_id': { "$ne": req.params.id } });
    if (checkUnique && checkUnique.length > 0) {
      throw { errmsg: "DRIVER_UNIQUE_ERROR" }
    }
    var arr = [];
    var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
    console.log(profileImage);
    if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
    var profileImage1 = (profileImage.length === 0) ? "" : profileImage[0].filename;
    console.log("image", profileImage1);

    let userUpdate = await DriverModel.findOneAndUpdate({
      '_id': req.params.id
    },
      {
        'userName': req.body.userName,
        'mobile': req.body.mobile,
        'email': req.body.email,
        'profileImage': profileImage1,
      },
      { 'fields': { "_id": 1, "userName": 1, "mobile": 1, "email": 1, "profileImage": 1 }, new: true }
    );
    console.log(userUpdate);

    if (userUpdate && userUpdate.length !== 0) {
      let data = {
        _id: userUpdate._id,
        userName: userUpdate.userName,
        email: userUpdate.email,
        mobile: userUpdate.mobile,
        profileImage: (userUpdate.profileImage) ? userUpdate.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
      };
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_DATA_UPDATE_SUCCESS"), 'data': data });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_NOT_FOUND") });

  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      err.errmsg = req.i18n.__("DRIVER_UNIQUE_ERROR");
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};


/** 
 * Signup Driver
 * url : /api/driver/getUsers
 * method : GET
 * author : Sathyamoorthi.R
*/

exports.getUsers = (req, res, next) => {

  DriverModel.findOne({}, { password: 0 }, (err, users) => {
    res.status(200).json({
      success: true,
      data: users

    });

  });
};


/** 
 * Login Driver
 * url : /api/driver/login
 * method : POST
 * author : Sathyamoorthi.R
 * body   : UserName->(email, phone), password
*/

exports.login = async (req, res) => {
  try {
    let driver = await DriverModel.findOne({ $or: [{ 'email': req.body.username }, { 'mobile': req.body.username }] }, 'status password').exec();

    if (driver && ((driver.status !== _C.status.driver.inactive) && (driver.status !== _C.status.driver.deleted))) {

      if (HashService.compareHash(driver.password, req.body.password)) {

        let driverData = await DriverModel.findOneAndUpdate({ _id: driver._id }, { status: _C.status.driver.online }, { new: true }).select('-password');

        const token = Jwt.sign({ _id: driver._id, }, Config.API_SECRET, { algorithm: 'HS256', expiresIn: Config.TOKEN.EXPIRE });

        updateData(driverData, _C.status.user.online, true);
        res.json({ "statusCode": Config.error_code.success, "message": "DRIVER_LOGGEDIN_SUCCESS", "data": token });

      }
      throw { errmsg: 'INVALID_PASSWORD' }

    } else {
      let errmsg = (driver) ? 'Contact driver to activate your account' : 'Invalid username';
      throw { errmsg: errmsg }
    }
  } catch (err) {
    console.log("err", err)
    res.json({ "statusCode": Config.error_code.bad_request, "message": err.errmsg });

  }
};


function updateData(datas, status, onlineStatus) {

  if (!firebase.apps.length) {
    firebase.initializeApp(Config.firebasekey);
  }
  var id = datas._id.toString();
  var update = {};
  var db = firebase.database();
  update["status"] = status;
  update["onlineStatus"] = onlineStatus;
  db.ref("drivers").child(id).update(update, function (err) {
    if (err) { }
    logger.info(update)
  });
}
/** 
 * Logout driver
 * url : /api/driver/logout
 * method : POST
 * author : Sathyamoorthi.R
 * params : _id
*/

exports.logout = async function (req, res) {

  try {
    let condition = { _id: req.params.id };
    let driverData = await DriverModel.findOneAndUpdate(condition, { status: _C.status.driver.offline }, { new: true }).select('-password');
    if (driverData && driverData !== 0) {
      updateData(driverData, _C.status.driver.offline, false);
      res.json({ "statusCode": Config.error_code.success, "message": "Driver logged out success" });
    } else {

      throw { errmsg: 'DRIVERS_NOT_FOUND' }

    }
  } catch (err) {
    console.log(err)
    res.json({ "statusCode": Config.error_code.bad_request, "message": err.errmsg });
  }
}

/**  
 * driver change password
 * url : /api/driver/changePassword
 * method : POST
 * params : _id
 * body : password, newPassword, confirmPassword
*/
exports.changePassword = async (req, res) => {
  try {
    let driver = await DriverModel.findOne({ _id: req.params.id, status: 3 }).exec();
    if (driver) {
      let is_valid = HashService.compareHash(driver.password, req.body.password);
      if (is_valid) {
        let changePassword = HashService.generateHash(req.body.newPassword);
        let updatePassword = await DriverModel.findOneAndUpdate({ _id: req.params.id }, {
          password: changePassword
        }, { new: true })
          .exec();
        if (updatePassword) {
          return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PASSWORD_CHANGED") });
        }
        throw { errmsg: 'INVALID_PASSWORD' }
      }
      throw { errmsg: 'INVALID_PASSWORD' }
    }
    throw { errmsg: 'DRIVER_NOT_FOUND' }
  } catch (err) {
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
}

exports.currentLogin = async (req, res) => {
  console.log("req", req.body);
  if (req.headers && req.headers.authorization) {
    let authorization = req.headers.authorization;
    let token = authorization.split(' ');
    try {
      let decoded = Jwt.verify(token[1], Config.API_SECRET);
      let driverId = decoded._id;
      let model = await DriverModel.find({ _id: driverId }).select('userName mobile email otpVerification profileImage').limit(1).exec();
      console.log("------------------------------------", model);
      if (model && model.length > 0) {
        driver = {
          _id: model[0]._id,
          email: model[0].email,
          mobile: model[0].mobile,
          otpVerification: model[0].otpVerification,
          profileImage: (model[0].profileImage) ? model[0].profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
        }
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_CURRENT_DRIVER_SUCCESS"), "data": (driver) ? (driver) : '{}' });

      }
      throw { errmsg: 'DRIVERS_NOT_FOUND' }
    } catch (e) {
      console.log("error", e);
      return res.status(401).send('unauthorized');
    }
  }
}

exports.forgetPassword = async function (req, res) {
  console.log(req.body);
  try {
    let user = await DriverModel.findOne({ email: req.params.email }).exec();
    console.log(req.params);
    if (user) {
      let random = Math.floor(Math.random() * (55555555 - 3) + 3);
      newPassword = HashService.generateHash(random);
      console.log("password", random);
      let updatePassword = await DriverModel.findOneAndUpdate({
        email: req.params.email,
        status: { $in: [_C.status.user.active, _C.status.user.online] }
      },
        {
          password: newPassword
        }, { new: true }).exec();
      console.log("update ", updatePassword);

      if (updatePassword) {
        let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
        var getSMSDetails = smsSetting.smsSetting;
        var getSMTPDetails = smsSetting.smtpSetting;
        let condition = {
          'status': _C.status.adminPanel.active, 'notificationContentStatus': _C.status.adminPanel.active,
          'appType': _C.status.app.customer, 'notificationContentType': Config.notificationContentType.forgotPassword
        }
        let notification = await NotificationModel.find(condition).select('_id emailSubject emailContent smsContent notificationContentType notificationType appType pushNotificationContent');
        let notificationType = notification[0].notificationType;
        let emailContent = notification[0].emailContent;
        let smsContent = notification[0].smsContent;
        /*SMS*/
        var value = {
          mobile: user.mobile,
          replacementContent: random
        }
        var smsMessage = HashService.sendMessage(value, getSMSDetails, smsContent);
        if (smsMessage) {
          console.log("the message sended");
        } else {
          console.log("error");
        }
        let pushNotificationContent = notification[0].pushNotificationContent;
        if (notification && notification.length > 0) {
          notification = notification[0];
          if (emailContent && notification.emailContent && notification.emailSubject) {
            /*SMTP*/
            let transporter = NodeMailer.createTransport(SmtpTransport({
              host: getSMTPDetails.smtpHost,
              port: getSMTPDetails.smtpPort,
              secureConnection: true,
              auth: {
                user: getSMTPDetails.smtpUsername,
                pass: getSMTPDetails.smtpPassword
              }
            }))
            var getsite = smsSetting.siteInfo;
            var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
            var source = fs.readFileSync(templateDir, 'utf8');
            var template = Handlebars.compile(source);
            var data = {
              "userName": user.userName, "subject": notification.emailSubject,
              "projectName": getsite.siteName, "siteLogo": getsite.siteLogo,
              "replacementsContent": notification.emailContent + random,
              "supportMail": getsite.siteContactEmail,
            };
            var result = template(data);
            let mailOptions = {
              from: getSMTPDetails.smtpUsername,
              to: user.email,
              subject: notification.emailSubject,
              text: notification.emailContent + random,
              html: result // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return console.log(error);
              }
              console.log('Message sent: %s', info.messageId);
            });
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PLEASE_CHECK_YOUR_EMAIL"), 'data': { newPassword: random } });
          }
          throw { errmsg: 'INVALID_PASSWORD' }
        }
        throw { errmsg: 'DRIVER_NOT_FOUND' }
      }
    }
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
}
exports.ResendOtp = async function (req, res) {

  try {
    let getmobile = await DriverModel.findOne({ _id: req.params.id }).select('-_id mobile email userName');

    let random = Math.floor(100000 + Math.random() * 900000);
    verificationCode = random;


    let ResendOtp = await DriverModel.findOneAndUpdate({ _id: req.params.id }, { verificationCode: random }, { "fields": { "_id": 1, "verificationCode": 1 }, "new": true });
    if (ResendOtp) {
      if (getmobile) {
        let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
        var getSMSDetails = smsSetting.smsSetting;
        var getSMTPDetails = smsSetting.smtpSetting;
        let condition = {
          'status': _C.status.adminPanel.active, 'notificationContentStatus': _C.status.adminPanel.active,
          'appType': _C.status.app.customer, 'notificationContentType': Config.notificationContentType.resendOTP
        }
        let notification = await NotificationModel.find(condition).select('_id emailSubject emailContent smsContent notificationContentType notificationType appType pushNotificationContent');
        let notificationType = notification[0].notificationType;
        let emailContent = notification[0].emailContent;
        let smsContent = notification[0].smsContent;
        var value = {
          mobile: getmobile.mobile,
          replacementContent: random
        }
        var smsMessage = HashService.sendMessage(value, getSMSDetails, smsContent);
        if (smsMessage) {
          console.log("the message sended");
        } else {
          console.log("error");
        }
        let pushNotificationContent = notification[0].pushNotificationContent;
        if (notification && notification.length > 0) {
          notification = notification[0];
          if (emailContent && notification.emailContent && notification.emailSubject) {
            let transporter = NodeMailer.createTransport(SmtpTransport({
              host: getSMTPDetails.smtpHost,
              port: getSMTPDetails.smtpPort,
              secureConnection: true,
              auth: {
                user: getSMTPDetails.smtpUsername,
                pass: getSMTPDetails.smtpPassword
              }
            }))
            var getsite = smsSetting.siteInfo;
            var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
            var source = fs.readFileSync(templateDir, 'utf8');
            var template = Handlebars.compile(source);
            var data = {
              "userName": getmobile.userName, "subject": notification.emailSubject,
              "projectName": getsite.siteName, "siteLogo": getsite.siteLogo,
              "replacementsContent": notification.emailContent + random,
              "supportMail": getsite.siteContactEmail,
            };
            var result = template(data);
            let mailOptions = {
              from: getSMTPDetails.smtpUsername,
              to: getmobile.email,
              subject: notification.emailSubject,
              text: notification.emailContent + random,
              html: result // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return console.log(error);
              }
              console.log('Message sent: %s', info.messageId);
            });
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESEND_OTP_SUCCESS"), "data": ResendOtp });
          }
        }
        throw { errmsg: req.i18n.__('DRIVER_NOT_FOUND') }
      }
    }
  } catch (err) {

    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": {} });
  }
}
exports.statusChange = async function (req, res) {
  try {
    
      let condition = { _id: req.params.driverId };

      let updatDriverStatus = await DriverModel.findOneAndUpdate(condition, {'status':req.body.status}, { 'fields': { "_id": 1, "userName": 1, "mobile": 1, "email": 1, "profileImage": 1 }, new: true });
         
         if (updatDriverStatus && updatDriverStatus.length !== 0) {                        

          return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_STATUS_SUCCESS"),"data":updatDriverStatus });

        }
         throw { errmsg: 'DRIVER_STATUS_FAILED' }
  }
  catch(err){
    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": {} });
  }
}

exports.otpVerification = async function (req, res) {
  console.log(req.body);
  try {
    let user = await DriverModel.findOne({ _id: req.params.id }).exec();
    console.log("user", user)
    console.log(user.verificationCode == req.body.verificationCode)
    console.log(user.verificationCode)
    console.log(req.body.verificationCode)
    if (user) {
      if (user.verificationCode == req.body.verificationCode) {
        let condition = { _id: req.params.id, otpVerification: false };
        let verification = await DriverModel.findOneAndUpdate(condition, { otpVerification: true, verificationCode: 0 }, { "fields": { "_id": 1, "userName": 1, "email": 1, "mobile": 1, "countryCode": 1, "otpVerification": 1 }, "new": true });

        console.log("verify", verification);
        if (verification) {
          let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
          var getSMSDetails = smsSetting.smsSetting;
          var getSMTPDetails = smsSetting.smtpSetting;
          let condition = {
            'status': _C.status.adminPanel.active, 'notificationContentStatus': _C.status.adminPanel.active,
            'appType': _C.status.app.customer, 'notificationContentType': Config.notificationContentType.successRegistration
          }
          let notification = await NotificationModel.find(condition).select('_id emailSubject emailContent smsContent notificationContentType notificationType appType pushNotificationContent');
          let notificationType = notification[0].notificationType;
          let emailContent = notification[0].emailContent;
          let smsContent = notification[0].smsContent;
          /*SMS*/
          var value = {
            mobile: user.mobile,
            replacementContent: " "
          }
          var smsMessage = HashService.sendMessage(value, getSMSDetails, smsContent);
          if (smsMessage) {
            console.log("the message sended");
          } else {
            console.log("error");
          }
          let pushNotificationContent = notification[0].pushNotificationContent;
          if (notification && notification.length > 0) {
            notification = notification[0];
            if (emailContent && notification.emailContent && notification.emailSubject) {
              /*SMTP*/
              let transporter = NodeMailer.createTransport(SmtpTransport({
                host: getSMTPDetails.smtpHost,
                port: getSMTPDetails.smtpPort,
                secureConnection: true,
                auth: {
                  user: getSMTPDetails.smtpUsername,
                  pass: getSMTPDetails.smtpPassword
                }
              }))
              var getsite = smsSetting.siteInfo;
              var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
              var source = fs.readFileSync(templateDir, 'utf8');
              var template = Handlebars.compile(source);
              var data = {
                "userName": user.userName, "subject": notification.emailSubject,
                "projectName": getsite.siteName, "siteLogo": getsite.siteLogo,
                "replacementsContent": notification.emailContent,
                "supportMail": getsite.siteContactEmail,
              };
              var result = template(data);
              let mailOptions = {
                from: getSMTPDetails.smtpUsername,
                to: user.email,
                subject: notification.emailSubject,
                text: notification.emailContent,
                html: result // html body
              };
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
              });
              /*Notification To be Added Here*/
              data = {
                _id: verification._id,
                email: verification.email,
                mobile: verification.mobile,
                otpVerification: verification.otpVerification,
                profileImage: (verification.profileImage) ? verification.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
              }
              return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("OTP_VERIFICATED"), 'data': data });
            }
            throw { errmsg: 'OTP_VERIFIED_FAIL' }
          }
          //throw { errmsg: '' }
          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("NOT_OTP_VERIFICATED"), 'data': { verificationCode: "Verification Code Miss Matched" } });
        }
        throw { errmsg: req.i18n.__('DRIVER_NOT_FOUND') }

      }
    }
  } catch (err) {

    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": [] });
  }
}
