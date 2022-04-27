const UserRoute = require('express').Router();
const UserModel = require('../../models/User');
const Config = require('config');
const HashService = require('../../services/helper');
const UserValidator = require('../../validators/UserValidator');
const SignupUserValidator = require('../../validators/SignupUserValidator');
const _C = require('../../config/constants');
const Jwt = require('jsonwebtoken');
const firebase = require('firebase');
const HttpStatus = require('http-status-codes');
const multer = require('multer');
const path = require('path');
const validate = require('express-validation');
const lodash = require('lodash');
const NodeMailer = require('nodemailer');
const SmtpTransport = require('nodemailer-smtp-transport');
const Setting = require('../../models/Setting');
const NotificationModel = require('../../models/Notification');
const Handlebars = require('handlebars');
const fs = require('fs');
const logger = require('../../services/logger');
const _ = require('lodash');



var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "profileImage" || file.fieldname === "profileImage") {
            cb(null, 'assets/images/user');
        }

    },
    filename: (req, file, cb) => {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        /*File type Validation */
        /*var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return cb(new Error('Only images are allowed'))
                    
        }*/
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
 * Signup Admin
 * url : /api/admin/signup
 * method : POST
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, password, role
*/

exports.signup = async (req, res) => {
    console.log("filessssssssss", req.body.name);

    try {
        const { errors, isValid } = SignupUserValidator.add(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        let checkUnique = await UserModel.findOne({ 'email': req.body.email }).exec();

        if (checkUnique) {
            throw { "error": { "email": req.i18n.__("USER_EMAIL_UNIQUE_ERROR") } }
        }
        let checkUnique1 = await UserModel.findOne({ 'mobile': req.body.mobile }).exec();

        if (checkUnique1) {
            throw { "error": { "mobile": req.i18n.__("USER_MOBILE_UNIQUE_ERROR") } }
        }
        let random = Math.floor(100000 + Math.random() * 900000);
        let newDoc = new UserModel(req.body);
        newDoc.verificationCode = random;
        newDoc.password = HashService.generateHash(req.body.password);
        let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
        //console.log("smsSetting", smsSetting);
        var getSMSDetails = smsSetting.smsSetting;
        var getsite = smsSetting.siteInfo;
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
                // /*MAIL*/
                var getSMTPDetails = smsSetting.smtpSetting;
                let transporter = NodeMailer.createTransport(SmtpTransport({
                    host: getSMTPDetails.smtpHost,
                    port: getSMTPDetails.smtpPort,
                    secureConnection: true,
                    auth: {
                        user: getSMTPDetails.smtpUsername,
                        pass: getSMTPDetails.smtpPassword
                    }
                }))
                var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
                var source = fs.readFileSync(templateDir, 'utf8');
                var template = Handlebars.compile(source);
                var data = {
                    "userName": newDoc.firstName + ' ' + newDoc.lastName, "subject": notification.emailSubject,
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
        // var arr = [];
        // var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);

        // if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        // newDoc.profileImage = (profileImage.length === 0) ? "" : profileImage[0].filename;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let userDetails = {
                _id: newDoc._id,
                firstName: newDoc.firstName,
                lastName: newDoc.lastName,
                verificationCode: newDoc.verificationCode
            }
            addUserToFb(newDoc);
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_DATA_SUCCESS"), 'data': userDetails });
        } else {

            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
        }
    } catch (err) {
        console.log("err", err);
        /*if (err.code == 11000) {
             err.error = {"mobile":req.i18n.__("USER_UNIQUE_ERROR")};
         }
         */
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}

/** 
 * Add To user details in firebase 
*/
function addUserToFb(datas) {

    if (!firebase.apps.length) {
        firebase.initializeApp(Config.firebasekey);
    }

    var db = firebase.database();
    var ref = db.ref("users");
    var requestData = {
        firstName: datas.firstName,
        lastName: datas.lastName,
        mobile: datas.mobile,
        status: datas.status
    };
    var id = datas._id.toString();
    var usersRef = ref.child(id);

    usersRef.set(requestData, function (snapshot) {
        logger.info(requestData)
    });
}

/** 
 * Update User
 * url : /api/user/update
 * method : PUT
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, profileImage
*/
exports.update = async (req, res) => {
    console.log("", req.body);
    try {
        let checkUnique = await UserModel.find({ 'email': req.body.email, '_id': { "$ne": req.params.id } });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "USER_UNIQUE_ERROR" }
        }
        var arr = [];
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
        console.log(profileImage);
        if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        var profileImage1 = (profileImage.length === 0) ? "" : profileImage[0].filename;
        console.log("image", profileImage1);

        let userUpdate = await UserModel.findOneAndUpdate({
            '_id': req.params.id
        },
            {
                'firstName': req.body.firstName,
                'lastName': req.body.lastName,
                'mobile': req.body.mobile,
                'email': req.body.email,
                'profileImage': profileImage1
            },
            { 'fields': { "_id": 1, "firstName": 1, "lastName": 1, "mobile": 1, "email": 1, "profileImage": 1 }, new: true }
        );
        console.log(userUpdate);

        let data = {
            _id: userUpdate._id,
            email: userUpdate.email,
            mobile: userUpdate.mobile,
            profileImage: (userUpdate.profileImage) ? userUpdate.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
        };
        if (userUpdate && userUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_DATA_UPDATE_SUCCESS"), 'data': data });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("USER_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/**
 * User forgetPassword
 * Method:POST
 * url:/api/user/forgetPassword
 */

exports.forgetPassword = async function (req, res) {
    console.log(req.body);
    try {
        let user = await UserModel.findOne({ email: req.params.email }).exec();
        console.log("email", user);

        if (user) {
            let random = Math.floor(Math.random() * (55555555 - 3) + 3);
            newPassword = HashService.generateHash(random);
            let updatePassword = await UserModel.findOneAndUpdate({
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
                var getsite = smsSetting.siteInfo;
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
                        var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
                        var source = fs.readFileSync(templateDir, 'utf8');
                        var template = Handlebars.compile(source);
                        var data = {
                            "userName": user.firstName + ' ' + user.lastName, "subject": notification.emailSubject,
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
                            html: result, // html body
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
                throw { errmsg: 'USER_NOT_FOUND' }
            }
        }
    }
    catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/** 
 * Signup Admin
 * url : /api/admin/getUsers
*/
exports.getUsers = (req, res, next) => {
    UserModel.find({ 'status': { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }, { firstName: 1, lastName: 1, _id: 1, mobile: 1, email: 1 }, (err, users) => {
        res.status(200).json({
            success: true,
            data: users
        });
    });
}
/** 
 * Login Admin
 * url : /api/admin/login
 * method : POST
 * author : Sathyamoorthi.R
 * body   : UserName->(email, phone), password
*/
exports.login = async (req, res) => {

    try {
        let user = await UserModel.findOne({ $or: [{ 'email': req.body.username }, { 'mobile': req.body.username }] }, 'status password loginAttempts').exec();
        //console.log("loginAttempts",user);
        if (user && ((user.status !== _C.status.user.inactive) && (user.status !== _C.status.user.deleted))) {

            if (HashService.compareHash(user.password, req.body.password)) {
                let loginAttemptCount = user.loginAttempts + 1;

                let userData = await UserModel.findOneAndUpdate({ '_id': user._id }, { 'status': _C.status.user.online, 'loginAttempts': loginAttemptCount }, { new: true }).select('otpVerification');

                let token = Jwt.sign({ _id: user._id, }, Config.API_SECRET, { algorithm: 'HS256', expiresIn: Config.TOKEN.EXPIRE });

                updateData(userData, _C.status.user.online, true);
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_LOGIN_SUCCESS"), "data": token });

            }
            throw { "error": { "password": req.i18n.__('INVALID_PASSWORD') } }

        } else {
            throw { "error": { "username": req.i18n.__('INVALID_USERNAME') } }
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) ? (err.error) : err });

    }
}

function updateData(datas, status, onlineStatus) {

    if (!firebase.apps.length) {
        firebase.initializeApp(Config.firebasekey);
    }
    var id = datas._id.toString();
    var update = {};
    var db = firebase.database();
    update["status"] = status;
    update["onlineStatus"] = onlineStatus;
    db.ref("users").child(id).update(update, function (err) {
        if (err) { }
        logger.info(update)
    });
}

exports.currentLogin = async (req, res) => {

    /* var data={
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          //profileImage:req.user.profileImage?req.user.profileImage:""
    }*/
    if (req.headers && req.headers.authorization) {
        let authorization = req.headers.authorization;
        let token = authorization.split(' ');
        try {
            let decoded = Jwt.verify(token[1], Config.API_SECRET);
            let userId = decoded._id;
            let model = await UserModel.find({ _id: userId }).select('name mobile email otpVerification profileImage').limit(1).exec();
            if (model && model.length > 0) {
                customer = {
                    _id: model[0]._id,
                    email: model[0].email,
                    mobile: model[0].mobile,
                    otpVerification: model[0].otpVerification,
                    profileImage: (model[0].profileImage) ? model[0].profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
                }
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_CURRENT_USER_SUCCESS"), "data": (customer) ? (customer) : '{}' });

            }
            throw { errmsg: 'USERS_NOT_FOUND' }


        } catch (e) {
            return res.status(401).send('unauthorized');
        }

    }


}

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
        let userData = await UserModel.findOneAndUpdate(condition, { status: _C.status.user.offline }, { new: true }).select('-password');
        if (userData && userData !== 0) {
            updateData(userData, _C.status.user.offline, false);
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_LOGGEDOUT") });
        }

        throw { errmsg: req.i18n.__('USER_NOT_FOUND') }

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
*/
exports.otpVerification = async function (req, res) {
    console.log(req.body);
    try {
        let user = await UserModel.findOne({ _id: req.params.id }).exec();
        console.log("user", user)
        console.log(user.verificationCode == req.body.verificationCode)
        console.log(user.verificationCode)
        console.log(req.body.verificationCode)
        if (user) {
            if (user.verificationCode == req.body.verificationCode) {
                let condition = { _id: req.params.id, otpVerification: false };
                let verification = await UserModel.findOneAndUpdate(condition, { otpVerification: true, verificationCode: 0 }, { "fields": { "_id": 1, "name": 1, "email": 1, "mobile": 1, "countryCode": 1, "otpVerification": 1 }, "new": true });
                if (verification) {
                    let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
                    var getSMSDetails = smsSetting.smsSetting;
                    var getSMTPDetails = smsSetting.smtpSetting;
                    var getSite = smsSetting.siteInfo;
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
                    /*SMTP*/
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
                            var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
                            var source = fs.readFileSync(templateDir, 'utf8');
                            var template = Handlebars.compile(source);
                            var data = {
                                "userName": user.firstName + ' ' + user.lastName, "subject": notification.emailSubject,
                                "projectName": getSite.siteName, "siteLogo": getSite.siteLogo,
                                "replacementsContent": notification.emailContent,
                                "supportMail": getSite.siteContactEmail,
                            };
                            console.log("data", data)
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
                throw { errmsg: req.i18n.__('USER_NOT_FOUND') }

            }
        }
    } catch (err) {

        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": [] });
    }
}
/** 
 * Logout Admin
 * url : /api/admin/resndOtp
 * method : GET
 * author : Sathyamoorthi.R
 * params : _id
*/
exports.ResendOtp = async function (req, res) {

    try {
        let getmobile = await UserModel.findOne({ _id: req.params.id }).select('-_id firstName lastName mobile email');

        let random = Math.floor(100000 + Math.random() * 900000);
        verificationCode = random;

        let ResendOtp = await UserModel.findOneAndUpdate({ _id: req.params.id }, { verificationCode: random }, { "fields": { "_id": 1, "verificationCode": 1 }, "new": true });
        if (ResendOtp) {
            if (getmobile) {
                let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
                var getSMSDetails = smsSetting.smsSetting;
                var getSMTPDetails = smsSetting.smtpSetting;
                var getsite = smsSetting.siteInfo;
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
                        var templateDir = path.join(__dirname + '/../../template', 'mailer.html');
                        var source = fs.readFileSync(templateDir, 'utf8');
                        var template = Handlebars.compile(source);
                        var data = {
                            "userName": getmobile.firstName + ' ' + getmobile.lastName, "subject": notification.emailSubject,
                            "projectName": getsite.siteName, "siteLogo": getsite.siteLogo,
                            "replacementsContent": notification.emailContent + random,
                            "supportMail": getsite.siteContactEmail,
                        };
                        console.log("data", data)
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
            }
        }
        throw { errmsg: req.i18n.__('USER_NOT_FOUND') }
    } catch (err) {

        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": {} });
    }
}

exports.changePassword = async function (req, res) {

    try {
        let user = await UserModel.findOne({ _id: req.params.id, status: 3 }).exec();
        if (user) {
            let is_valid = HashService.compareHash(user.password, req.body.password);
            if (is_valid) {

                let changePassword = HashService.generateHash(req.body.newPassword);
                let updatePassword = await UserModel.findOneAndUpdate({ _id: req.params.id }, {
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
        throw { errmsg: 'USER_NOT_FOUND' }

    } catch (err) {

        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

exports.favouriteRestaurant = async (req, res) => {

    try {
        let user = await UserModel.find({ _id: req.params.userId }).limit(1).exec();

        if (user && user.length > 0) {

            let responseData = { resId: req.params.resId, is_favourite: 0 };
            let favRes = await UserModel.findOneAndUpdate({ _id: req.params.userId, favouriteRestaurant: { $exists: false } }, { favouriteRestaurant: [req.params.resId] }, { new: true });

            if (favRes) { // Newly added

                responseData.is_favourite = 1;
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAVOURITE_ADDED"), 'data': responseData });

            } else {
                let favResNew = await UserModel.findOneAndUpdate({ _id: req.params.userId, favouriteRestaurant: { $exists: true, $in: [req.params.resId] } }, { $pull: { favouriteRestaurant: req.params.resId } }, { new: true });

                if (favResNew) { // IF exists remove
                    responseData.is_favourite = 0;
                    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAVOURITE_REMOVED") });
                } else { // IF not exists add
                    let addFavRes = await UserModel.findOneAndUpdate({ _id: req.params.userId, favouriteRestaurant: { $exists: true, $nin: [req.params.resId] } }, { $push: { favouriteRestaurant: req.params.resId } }, { new: true });
                    if (addFavRes) {
                        responseData.is_favourite = 1;
                        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAVOURITE_ADDED") });
                    }
                }
            }
        } else {
            throw { errmsg: 'INVALID_USER_KEY' }
        }
    } catch (err) {
        console.log("err", err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

