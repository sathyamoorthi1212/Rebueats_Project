const UserRoute = require('express').Router();
const PromoCodeModel = require('../../models/PromoCode');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
const moment = require('moment');
const objectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
/** 
 * Add PromoCode
 * url : /api/admin/PromoCode/add
 * method : POST
 * author : Sathyamoorthi.R                    
*/
exports.add = async (req, res) => {

    try {
        let newDoc = new PromoCodeModel(req.body);
        let random = Math.random().toString(36).substring(4, 7) + Math.random().toString(36).substring(3, 7);
        newDoc.promoCode = random.toUpperCase();
        let checkPromo = await PromoCodeModel.find({ 'promoName': newDoc.promoName }).exec();

        if (checkPromo && checkPromo.length > 0) {
            throw { errmsg: "PROMO_NAME_UNIQUE_ERROR" }

        } else {
            newDoc = await newDoc.save();
        }

        if (newDoc && newDoc.length !== 0) {
            let promoCodeDetails = {
                _id: newDoc._id,
                promoName: newDoc.promoName,
                promoCode: newDoc.promoCode,
                promoDescription: newDoc.promoDescription,
                startDate: newDoc.startDate,
                //expireDate: newDoc.expireDate,
                endDate: newDoc.endDate,
                promoType: newDoc.promoType,
                promoOffer: newDoc.promoOffer,
                limit: newDoc.limit,
                minimumOrderAmount: newDoc.minimumOrderAmount
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_DATA_SUCCESS"), 'data': promoCodeDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("PROMO_CODE_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/** 
 * Update PromoCode        
 * url : /api/admin/PromoCode/update
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Currency _id
*/
exports.update = async (req, res) => {

    try {
        let newDoc = new PromoCodeModel(req.body);
        let random = Math.random().toString(36).substring(4, 7) + Math.random().toString(36).substring(3, 7);
        newDoc.promoCode = random.toUpperCase();
        let checkUnique = await PromoCodeModel.find({ 'promoName': req.body.promoName, '_id': { "$ne": req.params.id } });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "PROMO_NAME_UNIQUE_ERROR" }
        }
        let promoCodeUpdate = await PromoCodeModel.findOneAndUpdate({ '_id': req.params.id }, { 'promoName': req.body.promoName, 'promoCode': newDoc.promoCode, 'promoDescription': req.body.promoDescription, 'startDate': req.body.startDate, 'endDate': req.body.endDate, 'promoOffer': req.body.promoOffer, 'limit': req.body.limit, 'minimumOrderAmount': req.body.minimumOrderAmount, 'promoType': req.body.promoType }, { 'fields': { "_id": 1, "promoName": 1, "promoCode": 1, "promoDescription": 1, "startDate": 1, "endDate": 1, "promoOffer": 1, "limit": 1, "minimumOrderAmount": 1, "promoType": 1 }, new: true });

        if (promoCodeUpdate && promoCodeUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_DATA_UPDATE_SUCCESS"), 'data': promoCodeUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("PROMO_CODE_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/** 
 * list
 * url : /api/admin/PromoCode/list/
 * method : GET
 * author : Sathyamoorthi.R 
*/
// exports.list = async (req, res) => {
//     try {
//         let perPage = _C.pagination.pageSize, page = parseInt(req.params.page);
//         let list = await PromoCodeModel.find({ 'status': _C.status.adminPanel.active }).sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage).select('_id promoName promoCode promoDescription startDate endDate promoOffer limit minimumOrderAmount');

//         let total = list.length;

//         if (list && list.length > 0) {
//             return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_LIST_SUCCESS"), 'data': list, 'total': total });
//         }
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_NOT_FOUND") });
//     } catch (err) {
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
        if (typeof req.query.promoOffer_like != "undefined" && req.query.promoOffer_like != "") {
            likeQuery['promoOffer'] = req.query.promoOffer_like
        }
        if (typeof req.query.minimumOrderAmount_like != "undefined" && req.query.minimumOrderAmount_like != "") {
            likeQuery['minimumOrderAmount'] = req.query.minimumOrderAmount_like
        }
        if (typeof req.query.limit_like != "undefined" && req.query.limit_like != "") {
            likeQuery['limit'] = req.query.limit_like
        }
        if (typeof req.query.endDate_like != "undefined" && req.query.endDate_like != "") {
            likeQuery['endDate'] = { $lte: new Date(moment(req.query.endDate_like).endOf('day').format('YYYY-MM-DD')) }
        }
        if (typeof req.query.startDate_like != "undefined" && req.query.startDate_like != "") {
            likeQuery['startDate'] = { $gte: new Date(moment(req.query.startDate_like).endOf('day').format('YYYY-MM-DD')) }
        }
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getPromoCodeList = await PromoCodeModel.find(condition).count();
            res.header('x-total-count', getPromoCodeList);
        }
        let getPromoCodeList = await PromoCodeModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id promoName promoCode promoDescription startDate endDate promoOffer limit minimumOrderAmount promoType  ').exec();
        var getPromo = _.map(getPromoCodeList, function (o) {
            return {
                _id: o._id,
                promoName: o.promoName,
                promoCode: o.promoCode,
                promoDescription: o.promoDescription,
                startDate: o.startDate,
                endDate: o.endDate,
                promoOffer: o.promoOffer,
                // expireDate: o.expireDate,
                limit: o.limit,
                minimumOrderAmount: o.minimumOrderAmount,
                promoType: (o.promoType == 1) ? "percentage" : "amount",
            }
        })
        if (getPromoCodeList && getPromoCodeList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_LIST_SUCCESS"), 'data': getPromo });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}



/** 
 * Get PromoCode
 * url : /api/admin/PromoCode/getPromoCode
 * author : Sathyamoorthi.R 
 * params : id of PromoCode _id
*/
exports.getPromoCode = async (req, res) => {
    try {
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        let getPromoCode = await PromoCodeModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id promoName promoCode promoDescription startDate endDate promoOffer limit minimumOrderAmount promoType ').exec();
        var getPromo = _.map(getPromoCode, function (o) {
            console.log("ooooooooooooo", o);
            return {
                _id: o._id,
                promoName: o.promoName,
                promoCode: o.promoCode,
                promoDescription: o.promoDescription,
                startDate: o.startDate,
                endDate: o.endDate,
                promoOffer: o.promoOffer,
                //expireDate: o.expireDate,
                limit: o.limit,
                minimumOrderAmount: o.minimumOrderAmount,
                promoType: (o.promoType == 1) ? "percentage" : "amount",
            }
        })
        if (getPromoCode && getPromoCode.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_GET_SUCCESS"), 'data': getPromo });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

/** 
 * Delete PromoCode
 * url : /api/admin/PromoCode/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of PromoCode _id
*/
exports.delete = async (req, res) => {

    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deletePromoCode = await PromoCodeModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deletePromoCode) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await PromoCodeModel.findOneAndUpdate({ '_id': req.params.PromoId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PROMO_CODE_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PROMO_CODE_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
