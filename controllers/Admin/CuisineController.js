const UserRoute = require('express').Router();
const CuisineModel = require('../../models/Cuisine');
const Config = require('config');
const cuisineValidator = require('../../validators/CuisineValidator');
const multer = require('multer');
const lodash = require('lodash');
const Jwt = require('jsonwebtoken');
const _ = require('lodash');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const path = require('path');
const HelperFunc = require('./Function');
/** 
 * Add Cuisine
 * url : /api/admin/cuisine/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
var storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if (file.fieldname === "cuisineImage" || file.fieldname === "cuisineImage") {
      cb(null, 'assets/images/cuisine');
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
exports.add = async (req, res) => {

  try {
    const { errors, isValid } = cuisineValidator(req.body);
    if (!isValid) {
      throw { "error": errors }
    }
    let check = await CuisineModel.findOne({ 'cuisineName': req.body.cuisineName }).exec();

    if (check) {
      throw { "error": { "cuisineName": req.i18n.__("CUISINE_NAME_UNIQUE_ERROR") } }
    }
    let newDoc = new CuisineModel(req.body);
    let checkUnique = await CuisineModel.find({ 'cuisineName': newDoc.cuisineName });
    if (checkUnique && checkUnique.length > 0) {
      throw { errmsg: "CUISINE_UNIQUE_ERROR" }
    } else {
      var arr = [];
      var cuisineImage = lodash.filter(req.files, ['fieldname', 'cuisineImage']);

      if (cuisineImage.length !== 0) { arr.push(cuisineImage[0].path) }
      newDoc.cuisineImage = (cuisineImage.length === 0) ? "" : cuisineImage[0].filename;

      newDoc = await newDoc.save();
    }

    if (newDoc && newDoc.length !== 0) {
      let cuisineDetails = {
        _id: newDoc._id,
        cuisineName: newDoc.cuisineName,
        sortOrder: newDoc.sortOrder,
        cuisneImage: newDoc.cuisineImage
      }
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_DATA_SUCCESS"), 'data': cuisineDetails });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      err.errmsg = req.i18n.__("CUISINE_UNIQUE_ERROR");
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};


/** 
 * Update Cuisine
 * url : /api/admin/cuisine/update
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Cuisine _id
*/
exports.update = async (req, res) => {

  try {
    const { errors, isValid } = cuisineValidator(req.body);
    if (!isValid) {
      throw { "error": errors }
    }
    let check = await CuisineModel.findOne({ _id: { $ne: req.params.id } }).select('_id').exec();
    console.log('asf', check)
    if (!check) {
      throw { "error": { "cuisineName": req.i18n.__("CUISINE_UNIQUE_ERROR") } }
    }
    let checkUnique = await CuisineModel.find({ 'cuisineName': req.body.cuisineName, '_id': { "$ne": req.params.id } });
    if (checkUnique && checkUnique.length > 0) {
      throw { errmsg: "CUISINE_UNIQUE_ERROR" }
    }
    var arr = [];
    var cuisineImage = lodash.filter(req.files, ['fieldname', 'cuisineImage']);

    if (cuisineImage.length !== 0) { arr.push(cuisineImage[0].path) }
    var cuisineImage1 = (cuisineImage.length === 0) ? "" : cuisineImage[0].filename;


    let cuisineUpdate = await CuisineModel.findOneAndUpdate({ '_id': req.params.id },
      {
        'cuisineName': req.body.cuisineName,
        'sortOrder': req.body.sortOrder,
        'cuisineImage': cuisineImage1
      },
      { 'fields': { "_id": 1, "cuisineName": 1, "sortOrder": 1, 'cuisineImage': 1 }, new: true });
    console.log("cuisasdf", cuisineUpdate)
    if (cuisineUpdate && cuisineUpdate.length !== 0) {

      var getCisineUpdate = {
        cuisineName: cuisineUpdate.cuisineName,
        sortOrder: cuisineUpdate.sortOrder,
        cuisineImage: (cuisineUpdate.cuisineImage) ? cuisineUpdate.cuisineImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
      }
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_DATA_UPDATE_SUCCESS"), 'data': getCisineUpdate });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_NOT_FOUND") });

  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      err.errmsg = req.i18n.__("CUISINE_UNIQUE_ERROR");
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};

/** 
 * Get Cuisine
 * url : /api/admin/cuisine/getCuisine
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Cuisine _id
*/
exports.getCuisine = async (req, res) => {
  try {
    var pagination = true, condition = {};
    var likeQuery = HelperFunc.likeQueryBuilder(req.query);
    var pageQuery = HelperFunc.paginationBuilder(req.query);
    var sortQuery = HelperFunc.sortQueryBuilder(req.query);

    if (req.params.id) {
      pagination = false;
      condition = { _id: req.params.id, status: _C.status.adminPanel.active };
    }

    if (pagination) {
      condition = likeQuery;
      condition['status'] = _C.status.adminPanel.active;
      let getCuisineCount = await CuisineModel.find(condition).count();
      res.header('x-total-count', getCuisineCount);
    }

    let getCuisine = await CuisineModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id cuisineName sortOrder cuisineImage').exec();

    if (getCuisine && getCuisine.length > 0) {
      var cuisine = _.map(getCuisine, function (o) {
        return {
          _id: o._id,
          cuisineName: o.cuisineName,
          sortOrder: o.sortOrder,
          cuisineImage: (o.cuisineImage) ? o.cuisineImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`
        }
      })
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_LIST_SUCCESS"), 'data': cuisine });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_NOT_FOUND") });
  } catch (err) {
    console.log("error", err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};

/** 
 * Delete Cuisine
 * url : /api/admin/cuisine/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Cuisine _id
*/
exports.delete = async (req, res) => {
  console.log("rrrrrrrr", req.params.id);

  try {
    let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
    console.log("cccccc", condition)
    let deleteCuisine = await CuisineModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });
    console.log("deleteCuisine", deleteCuisine);

    if (deleteCuisine) {

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_DELETE_SUCCESS") });

    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_NOT_FOUND") });

    }


  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};

exports.activeCuisine = async (req, res) => {
  try {

    let list = await CuisineModel.find({ 'status': _C.status.adminPanel.active }).select('_id  cuisineName  ');
    if (list && list.length > 0) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_LIST_SUCCESS"), 'data': list });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_NOT_FOUND") });
  } catch (err) {
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};


exports.changeStatus = async (req, res) => {
  console.log("req.body", req.body);
  try {
    let changeStatus = await CuisineModel.findOneAndUpdate({ '_id': req.params.CuisineId }, { new: true });
    console.log("changeStatus", changeStatus);
    if (changeStatus) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_STATUS_CHANGES_SUCCESSFULLY") })
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_STATUS_NOT_CHANGED") })
  } catch (err) {
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};