const UserRoute = require('express').Router();
const ContactusModel = require('../../models/Contactus');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
/** 
 * Get Contactus
 * url : /api/admin/contactus/list
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of contactus _id
*/
exports.list = async (req, res) => {

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
    let getRecords = await ContactusModel.find(condition).sort(sortQuery).select('_id contactusName contactusEmail contactusMobile contactusMessage contactusSubject').exec();

    if (getRecords && getRecords.length > 0) {

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CONTACTUS_LIST_SUCCESS"), 'data': getRecords });
    }

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CONTACTUS_NOT_FOUND") });

  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};
