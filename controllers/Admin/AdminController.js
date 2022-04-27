const UserRoute = require('express').Router();
const AdminModel = require('../../models/Admin');
const Config = require('config');
const HashService = require('../../services/helper');
const AdminRegister = require('../../validators/AdminValidator');
const _C = require('../../config/constants');
const path = require('path');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const HelperFunc = require('./Function');
const NodeMailer = require('nodemailer');
const SmtpTransport = require('nodemailer-smtp-transport');
const Setting = require('../../models/Setting');
var Handlebars = require('handlebars');
var fs = require('fs')
const NotificationModel = require('../../models/Notification');
/** 
 * Signup Admin
 * url : /api/admin/signup
 * method : POST
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, password, role
*/
exports.signup = async (req, res) => {

  try {
    let newDoc = new AdminModel(req.body);
    newDoc.password = HashService.generateHash(req.body.password);
    newDoc = await newDoc.save();


    if (newDoc && newDoc.length !== 0) {
      let adminDetails = {
        name: newDoc.name,
        email: newDoc.email,
        mobile: newDoc.mobile,
        role: newDoc.role
      }
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ADMIN_DATA_SUCCESS"), 'data': adminDetails });
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    }
  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      err.errmsg = req.i18n.__("ADMIN_UNIQUE_ERROR");
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};


/** 
 * Signup Admin
 * url : /api/admin/getUsers
 * method : GET
 * author : Sathyamoorthi.R
*/

exports.getUsers = async (req, res) => {
  // AdminModel.find({}, { password:0 }, (err, users) => {
  //   res.status(200).json({
  //     success: true,
  //     data: users
  //   });
  // });

  if (typeof req.query._sort === "undefined" || req.query._sort === "") {
    req.query._sort = "createdAt";
  }

  if (typeof req.query._order === "undefined" || req.query._order === "") {
    req.query._order = "DESC";
  }

  var likeQuery = HelperFunc.likeQueryBuilder(req.query);
  var pageQuery = HelperFunc.paginationBuilder(req.query);
  var sortQuery = HelperFunc.sortQueryBuilder(req.query);
  let TotCnt = AdminModel.find(likeQuery).count();
  let Datas = AdminModel.find(likeQuery, { 'name': 1, 'email': 1, 'mobile': 1, 'role': 1, 'status': 1, 'countryCode': 1 }).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take);
  try {
    var promises = await Promise.all([TotCnt, Datas]);
    res.header('x-total-count', promises[0]);
    var resstr = promises[1];
    res.status(200).json({
      success: true,
      data: resstr
    });
  }
  catch (err) {
    return res.json([]);
  }
};

/** 
 * Login Admin
 * url : /api/admin/login
 * method : POST
 * author : Sathyamoorthi.R
 * body   : UserName->(email, phone), email,password
*/

exports.login = async (req, res) => {
  try {
    let admin = await AdminModel.findOne({ 'email': req.body.email }, 'status password').exec();

    if (admin && ((admin.status !== 2) && (admin.status !== 5))) {

      if (HashService.compareHash(admin.password, req.body.password)) {

        let adminData = await AdminModel.findOneAndUpdate({ _id: admin._id }, { status: 3 }, { new: true }).select('-password');

        let token = Jwt.sign({ _id: admin._id, }, Config.API_SECRET, { algorithm: 'HS256', expiresIn: Config.TOKEN.EXPIRE });

        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ADMIN_LOGIN_SUCCESS"), "data": token });

      }
      throw { errmsg: req.i18n.__('INVALID_PASSWORD') }

    } else {
      throw { errmsg: req.i18n.__('INVALID_USERNAME') }
    }
  } catch (err) {

    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });


  }
};

/** 
 * Logout Admin
 * url : /api/admin/login
 * method : GET
 * author : Sathyamoorthi.R
 * params : _id
*/

exports.logout = async function (req, res) {

  try {
    let condition = { _id: req.params.id };
    let adminData = await AdminModel.findOneAndUpdate(condition, { status: 4 }, { new: true }).select('-password');

    if (adminData && adminData !== 0) {

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ADMIN_LOGGEDOUT") });

    }
    throw { errmsg: req.i18n.__('ADMIN_NOT_FOUND') }

  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
}

exports.delete = async (req, res) => {

  try {

    let condition = { _id: req.params.id };
    let deleteUser = await AdminModel.findOneAndRemove(condition);

    if (deleteUser) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_DELETE_SUCCESS") });

    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_NOT_FOUND") });
    }
  } catch (err) {
    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};

exports.forgetPassword = async function (req, res) {
  try {
    let user = await AdminModel.findOne({ email: req.params.email }).exec();
    if (user) {
      let random = Math.floor(Math.random() * (55555555 - 3) + 3);
      newPassword = HashService.generateHash(random);
      let updatePassword = await AdminModel.findOneAndUpdate({
        email: req.params.email,
        status: { $in: [_C.status.user.active, _C.status.user.online] },
      },
        {
          password: newPassword
        }, { new: true }).exec();
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
          type: 2,
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
              "userName": user.name, "subject": notification.emailSubject,
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
        throw { errmsg: 'ADMIN_NOT_FOUND' }
      }
    }
  }
  catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
}
/**  
 * Admin detail update
 * url : /api/admin/update
 * method : PUT
 * params : _id
*/
exports.update = (req, res) => {
  AdminModel.findOneAndUpdate({ '_id': req.params.id }, { "$set": req.body }, function (err, doc) {
    if (err) { return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err }); }
    if (!doc) { return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") }); }
    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ADMIN_UPDATED_SUCCESSFULLY") });
  })
}

exports.changePassword = async function (req, res) {
  try {
    let user = await AdminModel.findOne({ _id: req.params.id, status: 1 }).exec();
    if (user) {
      let is_valid = HashService.compareHash(user.password, req.body.password);
      if (is_valid) {
        let changePassword = HashService.generateHash(req.body.newPassword);
        let updatePassword = await AdminModel.findOneAndUpdate({ _id: req.params.id }, {
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
    throw { errmsg: 'ADMIN_NOT_FOUND' }

  } catch (err) {

    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
}


/**
 * Logout Admin
 * url : /api/admin/login
 * method : GET
 * author : Sathyamoorthi.R
 * params : _id

  /*AdminModel.findOne({ $or: [{ 'email': req.body.username }, { 'mobile': req.body.username }] }, (err, user) => {
    if (err) throw err;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else {
      // Found a user
      if (HashService.compareHash(user.password, req.body.password)) {
        const payload = {
          username: user.username,
          admin: user.admin
        };

        // generate token with payload
        const token = jwt.sign(payload, Config.API_SECRET, {
          algorithm: 'HS256',
          expiresIn: Config.TOKEN.EXPIRE
        });

        res.json({
          success: true,
          message: 'Create new token 8h',
          token: token
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Bad credentials.'
        });
      }
    }
  });
};*/

exports.changeStatus = async (req, res) => {
  try {
    let changeStatus = await AdminModel.findOneAndUpdate({ '_id': req.params.AdminId }, { new: true });
    if (changeStatus) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ADMIN_STATUS_CHANGES_SUCCESSFULLY") })
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ADMIN_STATUS_NOT_CHANGED") })
  } catch (err) {
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};
