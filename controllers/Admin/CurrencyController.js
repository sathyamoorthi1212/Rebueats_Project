const UserRoute = require('express').Router();
const CurrencyModel = require('../../models/Currency');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
/** 
 * Add Currency
 * url : /api/admin/Currency/add
 * method : POST
 * author : Sathyamoorthi.R                    
*/
exports.add = async (req, res) => {

    try {
        let newDoc = new CurrencyModel(req.body);
        let checkName = await CurrencyModel.findOne({ 'currencyName': newDoc.currencyName }).exec();
        let checkSymbol = await CurrencyModel.findOne({ 'currencySymbol': newDoc.currencySymbol }).exec();
        let checkCode = await CurrencyModel.findOne({ 'currencyCode': newDoc.currencyCode }).exec();
        if (checkName) {
            throw { errmsg: "CURRENCY_NAME_UNIQUE_ERROR" }
        } else if (checkCode) {
            throw { errmsg: "CURRENCY_CODE_UNIQUE_ERROR" }
        } else if (checkSymbol) {
            throw { errmsg: "CURRENCY_SYMBOL_UNIQUE_ERROR" }
        } else {
            newDoc = await newDoc.save();
        }

        if (newDoc && newDoc.length !== 0) {
            let currencyDetails = {
                _id: newDoc._id,
                currencyName: newDoc.currencyName,
                currencySymbol: newDoc.currencySymbol,
                currencyCode: newDoc.currencyCode,
                baseCurrency: newDoc.baseCurrency,
                currencyValue: newDoc.currencyValue
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_DATA_SUCCESS"), 'data': currencyDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CURRENCY_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/** 
 * Update Currency        
 * url : /api/admin/currency/update
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Currency _id
*/
exports.update = async (req, res) => {

    try {
        let checkUnique = await CurrencyModel.find({ 'currencyName': req.body.currencyName, '_id': { "$ne": req.params.id } });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "CURRENCY_NAME_UNIQUE_ERROR" }
        }
        let check = await CurrencyModel.find({ 'currencySymbol': req.body.currencySymbol, '_id': { "$ne": req.params.id } });
        if (check && check.length > 0) {
            throw { errmsg: "CURRENCY_SYMBOL_UNIQUE_ERROR" }
        }
        let checkvalue = await CurrencyModel.find({ 'currencyCode': req.body.currencyCode, '_id': { "$ne": req.params.id } });
        if (checkvalue && checkvalue.length > 0) {
            throw { errmsg: "CURRENCY_CODE_UNIQUE_ERROR" }
        }

        let currencyUpdate = await CurrencyModel.findOneAndUpdate({ '_id': req.params.id }, { 'currencyName': req.body.currencyName, 'currencySymbol': req.body.currencySymbol, 'baseCurrency': req.body.baseCurrency, 'currencyValue': req.body.currencyValue, 'currencyCode': req.body.currencyCode }, { 'fields': { "_id": 1, "currencyName": 1, "currencyCode": 1, "currencySymbol": 1, "currencyValue": 1, "baseCurrency": 1 }, new: true });

        if (currencyUpdate && currencyUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_DATA_UPDATE_SUCCESS"), 'data': currencyUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("CURRENCY_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/** 
 * list
 * url : /api/admin/currency/list/
 * method : GET
 * author : Sathyamoorthi.R 
*/
// exports.list = async (req, res) => {
//     try {
//         let perPage = _C.pagination.pageSize, page = parseInt(req.params.page);
//         let list = await CurrencyModel.find({ 'status': _C.status.adminPanel.active }).sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage).select('_id currencyName currencySymbol status baseCurrency currencyCode currencyValue');

//         let total = list.length;

//         if (list && list.length > 0) {
//             return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_LIST_SUCCESS"), 'data': list, 'total': total });
//         }
//         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_NOT_FOUND") });
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
        if (typeof req.query.baseCurrency_like != "undefined" && req.query.baseCurrency_like != "") {
            likeQuery['baseCurrency'] = req.query.baseCurrency_like
        }
        if (typeof req.query.currencyValue_like != "undefined" && req.query.currencyValue_like != "") {
            likeQuery['currencyValue'] = req.query.currencyValue_like
        }
        console.log("likeQuery", likeQuery)
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getCurrencyList = await CurrencyModel.find(condition).count();
            res.header('x-total-count', getCurrencyList);
        }
        let getCurrencyList = await CurrencyModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id currencyName currencySymbol status baseCurrency currencyCode currencyValue').exec();



        if (getCurrencyList && getCurrencyList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_LIST_SUCCESS"), 'data': getCurrencyList });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}





/** 
* Get Currency
* url : /api/admin/currency/getCurrency
* method : POST
* author : Sathyamoorthi.R 
* params : id of Currency _id
*/
exports.getCurrency = async (req, res) => {
    try {
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        let getCurrency = await CurrencyModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id currencyName currencyCode currencySymbol baseCurrency status currencyValue').exec();

        if (getCurrency && getCurrency.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_LIST_SUCCESS"), 'data': getCurrency });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_NOT_FOUND"), 'data': {} });
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

/** 
 * Delete Currency
 * url : /api/admin/currency/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Currency _id
*/
exports.delete = async (req, res) => {

    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteCurrency = await CurrencyModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteCurrency) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.changeStatus = async (req, res) => {
    console.log("req.body", req.body);
    try {
        let changeStatus = await CurrencyModel.findOneAndUpdate({ '_id': req.params.CurrencyId }, { new: true });
        console.log("changeStatus", changeStatus);
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CURRENCY_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CURRENCY_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

