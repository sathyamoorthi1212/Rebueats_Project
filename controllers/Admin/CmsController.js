const Cms = require('../../models/Cms');
const HttpStatus = require('http-status-codes');
const HelperFunc = require('./Function');
const _C = require('../../config/constants');
const _ = require('lodash');

/**
 * Add FAQ 
 */
exports.addCms = async (req, res) => {
    console.log("req.body", req.body)
    try {
        var check = false;
        console.log("check", check);
        if (parseInt(req.body.cmsType) != 4) {
            check = await Cms.findOne({ $and: [{ appType: req.body.appType }, { cmsType: req.body.cmsType }] }).exec();
        }
        let newDoc = new Cms(req.body);
        if (check) {
            throw { errmsg: "CMS_&_APP_TYPE_UNIQUE_ERROR" }
        }

        else {
            newDoc = await newDoc.save();
        }
        console.log("newDoc", newDoc)
        if (newDoc && newDoc.length !== 0) {
            let showData = {
                _id: newDoc._id,
                cmsTitle: newDoc.cmsTitle,
                cmsDescription: newDoc.cmsDescription,
                cmsUrl: newDoc.cmsUrl,
                appType: newDoc.appType,
                cmsType: newDoc.cmsType,
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CMS_ADDED_SUCCESSFULLY"), 'data': showData });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        console.log("error", err)
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CMS_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

exports.listCms = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true, Condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        if (typeof req.query.appType_like != "undefined" && req.query.appType_like != "") {
            likeQuery['appType'] = req.query.appType_like
        }
        if (typeof req.query.cmsType_like != "undefined" && req.query.cmsType_like != "") {
            likeQuery['cmsType'] = req.query.cmsType_like
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getCmsCount = await Cms.find(condition).count();
            res.header('x-total-count', getCmsCount);
        }
        let getCmsList = await Cms.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
            .select('_id cmsTitle cmsDescription cmsUrl appType cmsType')
            .exec();
        if (getCmsList && getCmsList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CMS_LIST_SUCCESS"), 'data': getCmsList });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CMS_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}



exports.updateCms = async (req, res) => {
    console.log("req.body", req.body)
    try {
        var check = false;
        if (parseInt(req.body.cmsType) != 4) {
            check = await Cms.findOne({ $and: [{ appType: req.body.appType }, { cmsType: req.body.cmsType }] }).exec();
        }
        if (check) {
            throw { errmsg: "CMS_&_APP_TYPE_UNIQUE_ERROR" }
        }
        else {
            let cmsUpdate = await Cms.findOneAndUpdate({ '_id': req.params.id }, { 'cmsTitle': req.body.cmsTitle, 'cmsDescription': req.body.cmsDescription, 'cmsUrl': req.body.cmsUrl, 'appType': req.body.appType, 'cmsType': req.body.cmsType }, { 'fields': { "_id": 1, "cmsTitle": 1, "cmsDescription": 1, "cmsUrl": 1, 'appType': 1, 'cmsType': 1 }, new: true });
            if (cmsUpdate && cmsUpdate.length !== 0) {
                console.log("cmsUpdate", cmsUpdate)
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CMS_DATA_UPDATE_SUCCESS"), 'data': cmsUpdate });
            }
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CMS_NOT_FOUND") });

        }
    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CMS_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};


exports.deleteCms = async (req, res) => {
    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteCms = await Cms.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteCms) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CMS_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CMS_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await Cms.findOneAndUpdate({ '_id': req.params.CmsId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CMS_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CMS_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};



