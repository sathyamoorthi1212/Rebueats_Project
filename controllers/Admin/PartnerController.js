//npm  package
const Config = require('config');
const multer = require('multer');
const path = require('path');
const lodash = require('lodash');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');
//function
const HashService = require('../../services/helper');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');

//model
const PartnersModel = require('../../models/Partners');

//validation

const SignupUserValidator = require('../../validators/SignupUserValidator');


var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "profileImage" || file.fieldname === "profileImage") {
            cb(null, 'assets/images/partner');
        }

        else if (file.fieldname === "restaurantImage" || file.fieldname === "restaurantImage") {
            cb(null, 'assets/images/restaurant');
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
            return res.status(400).json({ "success": false, 'message': err.message })
        }
        else { next(); }
    })
}
/**  
 * create new partner
 * method : POST
 * url    : /api/admin/partners/add
 * body   : firstName, lastName, email, mobile, password, profileImage
*/
exports.partnersAdd = async (req, res) => {
    try {
        const { errors, isValid } = SignupUserValidator.add(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        let checkUnique = await PartnersModel.findOne({ 'email': req.body.email }).exec();
        if (checkUnique) {
            throw { "error": { "email": req.i18n.__("USER_EMAIL_UNIQUE_ERROR") } }
        }
        let checkUnique1 = await PartnersModel.findOne({ 'mobile': req.body.mobile }).exec();
        if (checkUnique1) {
            throw { "error": { "mobile": req.i18n.__("USER_MOBILE_UNIQUE_ERROR") } }
        }
        // let random = Math.floor(100000 + Math.random() * 900000);
        let newDoc = new PartnersModel(req.body);
        // newDoc.verificationCode = random;
        newDoc.password = HashService.generateHash(req.body.password);

        var arr = [];
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);

        if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        newDoc.profileImage = (profileImage.length === 0) ? "" : profileImage[0].filename;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let userDetails = {
                _id: newDoc._id,
                firstName: newDoc.firstName,
                lastName: newDoc.lastName,
                email: newDoc.email,
                mobile: newDoc.mobile,
                verificationCode: newDoc.verificationCode
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DATA_SUCCESS"), 'data': userDetails });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}

/**  
 * list of partner data
 * method : GET
 * url    : /api/admin/partners/list
 * params : _id (optional)
*/
exports.partnersList = async (req, res) => {

    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true, condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id };
            condition['status'] = { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] };
        }

        if (pagination) {
            condition = likeQuery;
            condition['status'] = { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] };
            let getPartnerCount = await PartnersModel.find(condition).count();
            res.header('x-total-count', getPartnerCount);
        }
        let getPartner = await PartnersModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).exec();
        let mapDoc = getPartner.map((el) => {
            return {
                '_id': el._id,
                'firstName': el.firstName,
                'lastName': el.lastName,
                'email': el.email,
                'mobile': el.mobile,
                'profileImage': el.profileImage ? el.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`,
            }
        })

        if (getPartner && getPartner.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_LIST_SUCCESS"), 'data': mapDoc });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });
    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/**  
 * partner data softdel
 * method : POST
 * url    : /api/admin/partners/delete
 * params : _id
*/
exports.partnersDelete = async (req, res) => {
    try {
        let condition = { _id: req.params.id };
        condition['status'] = { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] };
        let deletePartner = await PartnersModel.findOneAndUpdate(condition, { status: _C.status.user.deleted }, { new: true });
        if (deletePartner) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DELETE_SUCCESS") });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

/**  
 * update the partner detail
 * method : PUT
 * url    : /api/admin/partners/update
 * params : _id
 * body   : firstName, lastName, email, mobile, profileImage
*/
exports.partnersUpdate = async (req, res) => {
    try {
        const { errors, isValid } = SignupUserValidator.update(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        let checkUnique = await PartnersModel.findOne({ 'email': req.body.email, "_id": { "$ne": req.params.id } }).exec();
        if (checkUnique) {
            throw { "error": { "email": req.i18n.__("USER_EMAIL_UNIQUE_ERROR") } }
        }
        let checkUnique1 = await PartnersModel.findOne({ 'mobile': req.body.mobile, "_id": { "$ne": req.params.id } }).exec();
        if (checkUnique1) {
            throw { "error": { "mobile": req.i18n.__("USER_MOBILE_UNIQUE_ERROR") } }
        }

        let newDoc = await PartnersModel.findById({ "_id": req.params.id });
        newDoc.firstName = req.body.firstName;
        newDoc.lastName = req.body.lastName;
        newDoc.email = req.body.email;
        newDoc.mobile = req.body.mobile;

        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
        if (profileImage.length != 0) {
            newDoc.profileImage = profileImage[0].filename
        }
        let updateDoc = await newDoc.save();

        if (updateDoc && updateDoc.length !== 0) {
            let userDetails = {
                _id: updateDoc._id,
                firstName: updateDoc.firstName,
                lastName: updateDoc.lastName,
                email: updateDoc.email,
                mobile: updateDoc.mobile,
                profileImage: updateDoc.profileImage
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_DATA_SUCCESS"), 'data': userDetails });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA"), 'dfa': ddf });
        }
    }
    catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}

exports.activePartner = async (req, res) => {
    try {

        let list = await PartnersModel.find({ 'status': { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }).select('_id   firstName lastName ');
        if (list && list.length > 0) {
            var partner = _.map(list, function (o) {
                return {
                    _id: o._id,
                    userName: (o.firstName) + (o.lastName) ? o.lastName : "",
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_LIST_SUCCESS"), 'data': partner });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_NOT_FOUND") });
    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
exports.generateCSV = (req, res, next) => {
    PartnersModel.find({ 'status': { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }, { firstName: 1, lastName: 1, _id: 1, mobile: 1, email: 1 }, (err, partners) => {
        res.status(200).json({
            success: true,
            data: partners
        });
    });
}


exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await PartnersModel.findOneAndUpdate({ '_id': req.params.PartnerId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PARTNER_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PARTNER_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

