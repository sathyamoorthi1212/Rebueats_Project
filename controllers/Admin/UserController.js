const UserRoute = require('express').Router();
const UserModel = require('../../models/User');
const Config = require('config');
const _ = require('lodash');
const HashService = require('../../services/helper');
const SignupUserValidator = require('../../validators/SignupUserValidator');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const multer = require('multer');
const path = require('path');
const validate = require('express-validation');
const lodash = require('lodash');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "profileImage" || file.fieldname === "profileImage") {
            cb(null, 'assets/images/user');
        }

    },
    filename: (req, file, cb) => {
        //PNG file validation
        // var mimetype = file.mimetype;
        // console.log("mimetype", mimetype)
        // var extname = path.extname(file.originalname).toLowerCase();
        // if (extname !== '.png') {
        //     return cb(new Error('Only png images are allowed'))
        // }

        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        console.log("mimetype", mimetype)
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        console.log("extname", extname)
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
 * create User
 * url : /api/admin/create
 * method : POST
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, password, role
*/
exports.create = async (req, res) => {
    console.log("filessssssssss", req.body.name);

    try {
        const { errors, isValid } = SignupUserValidator(req.body);
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
        let newDoc = new UserModel(req.body);
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
                mobile: newDoc.mobile,
                email: newDoc.email,
                profileImage: newDoc.profileImage,
                otpVerification: newDoc.otpVerification
            }
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
};

/** 
 * Update User
 * url : /api/admin/update
 * method : PUT
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, profileImage
*/

exports.update = async (req, res) => {

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
        if (userUpdate && userUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_DATA_UPDATE_SUCCESS"), 'data': userUpdate });
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
 * Delete User
 * url : /api/admin/userController/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of User _id
*/
exports.delete = async (req, res) => {

    try {

        let condition = { _id: req.params.id, status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } };
        let deleteUser = await UserModel.findOneAndUpdate(condition, { status: _C.status.user.deleted }, { new: true });

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


/** 
 * list User
 * url : /api/admin/userController/list
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of User _id
*/
// exports.list = async (req, res) => {

//     try {
//         let perPage = _C.pagination.pageSize, page = parseInt(req.params.page);
//         let list = await UserModel.find({ 'status': _C.status.adminPanel.active }).sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage).select('_id firstName lastName mobile email profileImage ');

//         let total = list.length;

//         if (list && list.length > 0) {
//             return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_LIST_SUCCESS"), 'data': list, 'total': total });
//         }
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_NOT_FOUND") });
//     } catch (err) {
//         console.log(err);
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
//     }
// };

exports.list = async (req, res) => {

    try {
        var pagination = true;
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] };
            let getUserList = await UserModel.find(condition).count();
            res.header('x-total-count', getUserList);
        }
        let getUserList = await UserModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id firstName lastName mobile email profileImage ').exec();

        if (getUserList && getUserList.length > 0) {
            var user = _.map(getUserList, function (o) {
                return {
                    _id: o._id,
                    firstName: o.firstName,
                    lastName: o.lastName,
                    mobile: o.mobile,
                    email: o.email,
                    profileImage: (o.profileImage) ? o.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
                }
            })

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_LIST_SUCCESS"), 'data': user });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_NOT_FOUND") });
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
exports.getuser = async (req, res) => {
    try {

        if (req.params.id) {
            condition = { _id: req.params.id, status: { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } };
        }
        let getuser = await UserModel.find(condition).select('_id firstName lastName mobile email profileImage ')
        if (getuser && getuser.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_LIST_SUCCESS"), 'data': getuser });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

exports.generateCSV = (req, res, next) => {
    UserModel.find({ 'status': { $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }, { firstName: 1, lastName: 1, _id: 1, mobile: 1, email: 1 }, (err, users) => {
        res.status(200).json({
            success: true,
            data: users
        });
    });
}

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await UserModel.findOneAndUpdate({ '_id': req.params.UserId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("USER_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};