const UserRoute = require('express').Router();
const CategoryModel = require('../../models/Category');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');

/** 
 * Add Cuisine
 * url : /api/admin/cuisine/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.add = async (req, res) => {

    try {
        let newDoc = new CategoryModel(req.body);
        let checkUnique = await CategoryModel.find({ 'categoryName': newDoc.categoryName });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "CATEGORY_NAME_UNIQUE_ERROR" }
        } else {
            newDoc = await newDoc.save();
        }

        if (newDoc && newDoc.length !== 0) {
            let cuisineDetails = {
                _id: newDoc._id,
                categoryName: newDoc.categoryName,
                sortOrder: newDoc.sortOrder
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CATEGORY_DATA_SUCCESS"), 'data': cuisineDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CATEGORY_UNIQUE_ERROR");
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
        let checkUnique = await CategoryModel.find({ 'categoryName': req.body.categoryName, '_id': { "$ne": req.params.id } });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "CATEGORY_NAME_UNIQUE_ERROR" }
        }
        let cuisineUpdate = await CategoryModel.findOneAndUpdate({ '_id': req.params.id }, { 'categoryName': req.body.categoryName, 'sortOrder': req.body.sortOrder }, { 'fields': { "_id": 1, "categoryName": 1, "sortOrder": 1 }, new: true });

        if (cuisineUpdate && cuisineUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CATEGORY_DATA_UPDATE_SUCCESS"), 'data': cuisineUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CATEGORY_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CATEGORY_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/** 
 * Get Cuisine
 * url : /api/admin/cuisine/getCategory
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Cuisine _id
*/
exports.getCategory = async (req, res) => {

    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        let condition = { status: _C.status.adminPanel.active };
        if (req.query.id) {
            condition = { _id: req.query.id, status: _C.status.adminPanel.active };
        }
        let getCategory = await CategoryModel.find(condition).sort(sortQuery).select('_id categoryName sortOrder').exec();

        if (getCategory && getCategory.length > 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CATEGORY_LIST_SUCCESS"), 'data': getCategory });

        }

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CATEGORY_NOT_FOUND") });

    } catch (err) {
        console.log(err);

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
    try {

        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteCuisine = await CategoryModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteCuisine) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CATEGORY_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CATEGORY_NOT_FOUND") });

        }


    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await CategoryModel.findOneAndUpdate({ '_id': req.params.CategoryId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CATEGORY_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CATEGORY_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
