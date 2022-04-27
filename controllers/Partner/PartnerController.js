const PartnerModel = require('../../models/Partners');
const Config = require('config');
const HashService = require('../../services/helper');
const SignupUserValidator = require('../../validators/SignupUserValidator');
const HelperFunc = require('../Admin/Function');
const Setting = require('../../models/Setting');
const _C = require('../../config/constants');
const OrderModel = require('../../models/Orders');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');
const multer = require('multer');
const path = require('path');
const validate = require('express-validation');
const lodash = require('lodash');
const firebase = require('firebase');
const NodeMailer = require('nodemailer');
const SmtpTransport = require('nodemailer-smtp-transport');
const Handlebars = require('handlebars');
const fs = require('fs');
const logger = require('../../services/logger');
const NotificationModel = require('../../models/Notification');


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
    console.log("filessssssssss", req.body);
    try {
        const { errors, isValid } = SignupUserValidator.add(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        let checkUnique = await PartnerModel.findOne({ 'email': req.body.email }).exec();

        if (checkUnique) {
            throw { "error": { "email": req.i18n.__("PARTNER_EMAIL_UNIQUE_ERROR") } }
        }
        let checkUnique1 = await PartnerModel.findOne({ 'mobile': req.body.mobile }).exec();
        console.log("check", checkUnique1);
        if (checkUnique1) {
            throw { "error": { "mobile": req.i18n.__("PARTNER_MOBILE_UNIQUE_ERROR") } }
        }
        let random = Math.floor(100000 + Math.random() * 900000);
        let newDoc = new PartnerModel(req.body);
        newDoc.verificationCode = random;
        newDoc.password = HashService.generateHash(req.body.password);
        let smsSetting = await Setting.findOne({ 'siteKey': _C.siteKey }).select('_id siteInfo smtpSetting smsSetting');
        var getSMSDetails = smsSetting.smsSetting;
        var getSMTPDetails = smsSetting.smtpSetting;
        let condition = {
            'status': _C.status.adminPanel.active, 'notificationContentStatus': _C.status.adminPanel.active,
            'appType': _C.status.app.customer, 'notificationContentType': Config.notificationContentType.registrationOTP
        }
        console.log("condition", condition)
        let notification = await NotificationModel.find(condition).select('_id emailSubject emailContent smsContent notificationContentType notificationType appType pushNotificationContent');
        console.log("notification", notification)
        let notificationType = notification[0].notificationType;
        console.log("notificationType", notificationType)
        let emailContent = notification[0].emailContent;
        console.log("emailContent", emailContent)
        let smsContent = notification[0].smsContent;
        console.log("smsContent", smsContent)
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
        var arr = [];
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);

        if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        newDoc.profileImage = (profileImage.length === 0) ? "" : profileImage[0].filename;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let partnerDetails = {
                _id: newDoc._id,
                firstName: newDoc.firstName,
                lastName: newDoc.lastName,
                profileImage: newDoc.profileImage,
                verificationCode: newDoc.verificationCode
            }
            addPartnerToFb(newDoc)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DATA_SUCCESS"), 'data': partnerDetails });
        } else {

            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
        }

    }
    catch (err) {
        console.log("err", err);

        /*if (err.code == 11000) {
             err.error = {"mobile":req.i18n.__("PARTNER_UNIQUE_ERROR")};
         }
         */
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}

/** 
 * Add To partners details in firebase 
*/
function addPartnerToFb(datas) {

    if (!firebase.apps.length) {
        firebase.initializeApp(Config.firebasekey);
    }

    var db = firebase.database();
    var ref = db.ref("partners");
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
        let checkUnique = await PartnerModel.find({ 'email': req.body.email, '_id': { "$ne": req.params.id } });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "PARTNER_EMAIL_UNIQUE_ERROR" }
        }
        var arr = [];
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
        console.log(profileImage);
        if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        var profileImage1 = (profileImage.length === 0) ? "" : profileImage[0].filename;
        console.log("image", profileImage1);

        let partnerUpdate = await PartnerModel.findOneAndUpdate({
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
        console.log(partnerUpdate);

        let data = {
            _id: partnerUpdate._id,
            email: partnerUpdate.email,
            mobile: partnerUpdate.mobile,
            profileImage: (partnerUpdate.profileImage) ? partnerUpdate.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
        };
        if (partnerUpdate && partnerUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DATA_UPDATE_SUCCESS"), 'data': data });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("PARTNER_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/** 
 * partner
 * url : /api/partner/list
*/


exports.list = async (req, res) => {

    try {
        var pagination = true;
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: { $ne: [_C.status.user.deleted, _C.status.user.inactive] } };
        }
        if (pagination) {
            condition = likeQuery;
            // condition['status'] = { $ne: [3, 2] };
            // console.log("ccccccccccccccccc--", condition)
            let getPartnerList = await PartnerModel.find({ status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }).count();
            res.header('x-total-count', getPartnerList);
            console.log("partner", getPartnerList)
        }
        let getPartnerList = await PartnerModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id firstName lastName mobile email profileImage ').exec();

        if (getPartnerList && getPartnerList.length > 0) {
            var partner = _.map(getPartnerList, function (o) {
                return {
                    _id: o._id,
                    firstName: o.firstName,
                    lastName: o.lastName,
                    mobile: o.mobile,
                    email: o.email,
                    profileImage: (o.profileImage) ? o.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
                }
            })

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_LIST_SUCCESS"), 'data': partner });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}


/** 
 * Get user
 * url : /api/admin/userController/getuser
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of userController _id
*/
exports.getpartner = async (req, res) => {
    try {

        if (req.params.id) {
            condition = { _id: req.params.id, status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } };
        }
        let getPartner = await PartnerModel.find(condition).select('_id firstName lastName mobile email profileImage ')
        if (getPartner && getPartner.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_LIST_SUCCESS"), 'data': getPartner });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};





/** 
 * Login Admin
 * url : /api/admin/login
 * method : POST
 * author : Sathyamoorthi.R
 * body   : UserName->(email, phone), password
*/
exports.login = async (req, res) => {
    console.log("request", req.body);
    try {
        let user = await PartnerModel.findOne({ $or: [{ 'email': req.body.username }, { 'mobile': req.body.username }] }, 'status password loginAttempts').exec();
        console.log("loginAttempts", user);
        if (user && ((user.status !== _C.status.user.inactive) && (user.status !== _C.status.user.deleted))) {

            if (HashService.compareHash(user.password, req.body.password)) {
                let loginAttemptCount = user.loginAttempts + 1;

                let partnerData = await PartnerModel.findOneAndUpdate({ '_id': user._id }, { 'status': _C.status.user.online, 'loginAttempts': loginAttemptCount }, { new: true }).select('otpVerification');

                let token = Jwt.sign({ _id: user._id, }, Config.API_SECRET, { algorithm: 'HS256', expiresIn: Config.TOKEN.EXPIRE });
                updateData(partnerData, _C.status.user.online, true);
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNERS_LOGIN_SUCCESS"), "data": token });

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
    db.ref("partners").child(id).update(update, function (err) {
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
            let partnerId = decoded._id;
            let model = await PartnerModel.find({ _id: partnerId }).select('firstName lastName mobile email otpVerification profileImage').limit(1).exec();
            if (model && model.length > 0) {
                customer = {
                    _id: model[0]._id,
                    firstName: model[0].firstName,
                    lastName: model[0].firstName,
                    email: model[0].email,
                    mobile: model[0].mobile,
                    otpVerification: model[0].otpVerification,
                    profileImage: (model[0].profileImage) ? model[0].profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
                }
                console.log("custom", customer);
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_CURRENT_PARTNER_SUCCESS"), "data": (customer) ? (customer) : '{}' });

            }
            throw { errmsg: 'PARTNERS_NOT_FOUND' }


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
        let partnersData = await PartnerModel.findOneAndUpdate(condition, { status: _C.status.user.offline }, { new: true }).select('-password');
        if (partnersData && partnersData !== 0) {
            updateData(partnersData, _C.status.user.offline, false);
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_LOGGEDOUT") });
        }

        throw { errmsg: req.i18n.__('PARTNER_NOT_FOUND') }

    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}


exports.changePassword = async function (req, res) {
    console.log("required body", req.body)
    try {
        let partner = await PartnerModel.findOne({ _id: req.params.id, status: 3 }).exec();

        if (partner) {
            let is_valid = HashService.compareHash(partner.password, req.body.password);
            if (is_valid) {

                let changePassword = HashService.generateHash(req.body.newPassword);
                let updatePassword = await PartnerModel.findOneAndUpdate({ _id: req.params.id }, {
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
        throw { errmsg: 'PARTNER_NOT_FOUND' }

    } catch (err) {

        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}
exports.forgetPassword = async function (req, res) {
    console.log(req.body);
    try {
        let user = await PartnerModel.findOne({ email: req.params.email }).exec();
        console.log(req.params);
        if (user) {
            let random = Math.floor(Math.random() * (55555555 - 3) + 3);
            newPassword = HashService.generateHash(random);
            console.log("password", random);
            let updatePassword = await PartnerModel.findOneAndUpdate({
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
                console.log("condition", condition);
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
                        var getsite = smsSetting.siteInfo;
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
                        console.log("templ", templateDir)
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
                            text: Config.SmsPassword + random,
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
                throw { errmsg: 'PARTNER_NOT_FOUND' }
            }
        }
    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}


exports.delete = async (req, res) => {
    console.log("rrrrrrrr", req.params.id);

    try {
        let condition = { _id: req.params.id, status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } };
        console.log("cccccc", condition)
        let deletePartner = await PartnerModel.findOneAndUpdate(condition, { status: _C.status.user.deleted }, { new: true });
        console.log("deletePartner", deletePartner);

        if (deletePartner) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });

        }


    } catch (err) {
        console.log(err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};


exports.confirmOrder = async (req, res) => {

    try {

        let condition = { _id: req.params.orderId };
        let updateData = { 'orderStatus.code': _C.status.order.confirmed };
        let booking = await new OrderModel().getOrder({ query: condition, fields: 'orderCode orderStatus userId' });
        if (booking.orderStatus.code == _C.status.order.pending) {

            let model = await OrderModel.findOneAndUpdate(condition, { 'orderStatus.confirmedAt': Date.now(), 'orderStatus.code': _C.status.order.confirmed }, { new: true });
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ORDER_CONFIRM_SUCCESS") });
        }
        throw { errmsg: 'INVALID_ORDER_REQUEST' }


    } catch (err) {
        console.log(err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

