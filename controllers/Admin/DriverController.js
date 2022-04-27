const UserRoute = require('express').Router();
const DriverModel = require('../../models/Driver');
const _ = require('lodash');
const Config = require('config');
const HashService = require('../../services/helper');
const SignupDriverValidator = require('../../validators/SignupDriverValidator');
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
 * create User
 * url : /api/admin/driver/create
 * method : POST
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, password, role
*/
exports.create = async (req, res) => {
    console.log("filessssssssss", req.body.name);

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
        var arr = [];
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);

        if (profileImage.length !== 0) { arr.push(profileImage[0].path) }
        newDoc.profileImage = (profileImage.length === 0) ? "" : profileImage[0].filename;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let driverDetails = {
                _id: newDoc._id,
                userName: newDoc.userName,
                mobile: newDoc.mobile,
                email: newDoc.email,
                profileImage: (newDoc.profileImage) ? (newDoc.profileImage) : `http://${Config.server.host}:${Config.server.port}/user/default.png`,
                otpVerification: newDoc.otpVerification
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_DATA_SUCCESS"), 'data': driverDetails });
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
 * url : /api/admin/driver/update
 * method : PUT
 * author : Sathyamoorthi.R
 * body   : Name, email, phone, profileImage
*/

exports.update = async (req, res) => {

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

        let newDoc = await DriverModel.findById({ '_id': req.params.id });
        newDoc.userName = req.body.userName;
        newDoc.mobile = req.body.mobile;
        newDoc.email = req.body.email;
        var profileImage = lodash.filter(req.files, ['fieldname', 'profileImage']);
        if (profileImage.length != 0) {
            newDoc.profileImage = profileImage[0].filename
        }
        let updateDoc = await newDoc.save();

        if (updateDoc && updateDoc.length !== 0) {
            let updatedDetails = {
                _id: updateDoc._id,
                userName: updateDoc.userName,
                mobile: updateDoc.mobile,
                email: updateDoc.email,
                profileImage: updateDoc.profileImage
            }

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_DATA_UPDATE_SUCCESS"), 'data': updatedDetails });
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
 * Delete User
 * url : /api/admin/driver/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of User _id
*/
exports.delete = async (req, res) => {

    try {

        let condition = { _id: req.params.id };
        condition['status'] = { $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] };
        let deletedriver = await DriverModel.findOneAndUpdate(condition, { status: _C.status.driver.deleted }, { new: true });

        if (deletedriver) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_NOT_FOUND") });
        }
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};


/** 
 * list driver
 * url : /api/admin/driver/list
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of User _id
*/
// exports.list = async (req, res) => {

//     try {
//         let perPage = _C.pagination.pageSize, page = parseInt(req.params.page);
//         let list = await DriverModel.find({ 'status': _C.status.adminPanel.active }).sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage).select('_id firstName lastName mobile email profileImage ');

//         let total = list.length;

//         if (list && list.length > 0) {
//             return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_LIST_SUCCESS"), 'data': list, 'total': total });
//         }
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_NOT_FOUND") });
//     } catch (err) {
//         console.log(err);
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
//     }
// };

exports.list = async (req, res) => {

    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true;
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id };
            condition['status'] = { $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = { $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] };
            let getDriverList = await DriverModel.find(condition).count();
            res.header('x-total-count', getDriverList);
        }
        let getDriverList = await DriverModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id userName mobile email profileImage ').exec();
        if (getDriverList && getDriverList.length > 0) {
            var driver = _.map(getDriverList, function (o) {
                return {
                    _id: o._id,
                    userName: o.userName,
                    mobile: o.mobile,
                    email: o.email,
                    profileImage: (o.profileImage) ? o.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_LIST_SUCCESS"), 'data': driver });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_NOT_FOUND") });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}



/** 
 * Get driver
 * url : /api/admin/driver/getuser
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of userController _id
*/
exports.getdriver = async (req, res) => {
    try {

        if (req.params.id) {
            condition = { _id: req.params.id };
            condition['status'] = { $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] };
        }
        let getdriver = await DriverModel.find(condition).select('_id firstName lastName mobile email profileImage ')
        if (getdriver && getdriver.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_LIST_SUCCESS"), 'data': getdriver });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
exports.generateCSV = (req, res, next) => {
    DriverModel.find({ 'status': { $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] } }, { userName: 1, _id: 1, mobile: 1, email: 1 }, (err, drivers) => {
        res.status(200).json({
            success: true,
            data: drivers
        });
    });
}

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await DriverModel.findOneAndUpdate({ '_id': req.params.DriverId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};