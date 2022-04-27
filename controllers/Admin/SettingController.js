const Config = require('config');
const _ = require('lodash');
const HelperFunc = require('./Function');
const _C = require('../../config/constants');
const multer = require('multer');
const path = require('path');
const SettingModel = require('../../models/Setting');
const HttpStatus = require('http-status-codes');
const lodash = require('lodash');
const UpdateAppValidator = require('../../validators/UpdateAppValidator');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "siteLogo" || file.fieldname === "siteLogo") {
            cb(null, 'assets/images/site');
        }

    },
    filename: (req, file, cb) => {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            cb(
                null,
                file.fieldname + path.extname(file.originalname)
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

exports.create = async function (req, res) {

    if (req.body) {
        req.body.siteKey = _C.siteKey;
    } else {
        req.body = { siteKey: _C.siteKey };
    }
    try {
        let model = new SettingModel(req.body);
        model = await model.save();
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("SITEKEY_CREATED"), 'data': model });
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, 'data': {} });
    }
}
exports.updateSmtp = async function (req, res) {
    try {
        let newDoc = {
            smtpHost: req.body.smtpHost,
            smtpPort: req.body.smtpPort,
            smtpUsername: req.body.smtpUsername,
            smtpPassword: req.body.smtpPassword,
            smtpEmail: req.body.smtpEmail,
            smtpName: req.body.smtpName
        }
        console.log("ddddddddddddd", newDoc)

        let updateSmtp = await SettingModel.findOneAndUpdate({ siteKey: _C.siteKey }, { smtpSetting: newDoc }, { new: true });

        if (updateSmtp && updateSmtp.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("SMTP_UPDATE_SUCCESS"), 'data': updateSmtp });
        }

    } catch (err) {
        console.log("err", err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, 'data': {} });
    }
}


exports.updateApp = async function (req, res) {
    try {
        const { errors, isValid } = UpdateAppValidator(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        console.log("SSSSSSSSSSSSSSSSSSSSSSSSsss", req.body)
        var arr = [];
        var siteLogo = lodash.filter(req.files, ['fieldname', 'siteLogo']);
        console.log("sitelogo", siteLogo);
        if (siteLogo.length !== 0) { arr.push(siteLogo[0].path) }
        var siteLogo1 = (siteLogo.length === 0) ? "" : siteLogo[0].filename;
        if (siteLogo.length == 0) {

            throw { "errmsg": { "siteLogo": req.i18n.__('SITE_LOGO_MUST_REQUIRED') } }

        }
        let newDoc = {
            siteName: req.body.siteName,
            siteTag: req.body.siteTag,
            siteLogo: siteLogo1,
            siteContactEmail: req.body.siteContactEmail,
            siteContactNumber: req.body.siteContactNumber,
            siteContactAddress: req.body.siteContactAddress,
            defaultCurrency: req.body.defaultCurrency,
            driverCommission: req.body.driverCommission

        }
        console.log("ddddddddddddd", newDoc)

        let updateApp = await SettingModel.findOneAndUpdate({ siteKey: _C.siteKey }, { siteInfo: newDoc }, { new: true });
        console.log("updateApp", updateApp)
        if (updateApp && updateApp.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("SMS_UPDATE_SUCCESS"), 'data': updateApp });
        }

    } catch (err) {
        console.log("err", err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, 'data': {} });
    }
}

exports.updateSms = async function (req, res) {
    try {
        let newDoc = {
            smsGatewayId: req.body.smsGatewayId,
            smsGatewayToken: req.body.smsGatewayToken,
            smsGatewayNumber: req.body.smsGatewayNumber
        }
        console.log("ddddddddddddd", newDoc)

        let updateSms = await SettingModel.findOneAndUpdate({ siteKey: _C.siteKey }, { smsSetting: newDoc }, { new: true });

        if (updateSms && updateSms.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("SMS_UPDATE_SUCCESS"), 'data': updateSms });
        }

    } catch (err) {
        console.log("err", err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, 'data': {} });
    }
}

exports.updateSocial = async function (req, res) {
    try {
        let newDoc = {
            socialFacebook: req.body.socialFacebook,
            socialTwitter: req.body.socialTwitter,
            socialGoogle: req.body.socialGoogle,
            socialLinkedin: req.body.socialLinkedin,
            socialInstagram: req.body.socialInstagram,
        }
        console.log("ddddddddddddd", newDoc)
        let updateSocial = await SettingModel.findOneAndUpdate({ siteKey: _C.siteKey }, { social_info: newDoc }, { new: true });

        if (updateSocial && updateSocial.length !== 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("SOCIAL_UPDATE_SUCCESS"), 'data': updateSocial });
        }

    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, 'data': {} });
    }
}

exports.list = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        let listSetting = await SettingModel.find().sort(sortQuery).select('_id siteInfo smtpSetting smsSetting ').exec();
        console.log("list", listSetting);
        if (listSetting && listSetting.length > 0) {
            return res.status(HttpStatus.OK).json({
                'success': true, 'message': req.i18n.__("SETTING_LIST_SUCCESS"), 'data': listSetting[0]
            });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("SETTING_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}
