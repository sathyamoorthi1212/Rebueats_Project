const NotificationModel = require('../../models/Notification');
const Config = require('config');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
/** 
 * Add Notification
 * url : /api/admin/Notification/add
 * method : POST
 * author : Sathyamoorthi.R                    
*/
exports.addNotification = async (req, res) => {
    console.log(req.body)
    try {
        let newDoc = new NotificationModel(req.body);
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let notificationDetails = {
                _id: newDoc._id,
                emailSubject: newDoc.emailSubject,
                emailContent: newDoc.emailContent,
                pushNotificationContent: newDoc.pushNotificationContent,
                smsContent: newDoc.smsContent,
                appType: newDoc.appType,
                notificationType: newDoc.notificationType,
                notificationContentType: newDoc.notificationContentType,
            }
            console.log("notificationDetails", notificationDetails)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("NOTIFICATION_DATA_SUCCESS"), 'data': notificationDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        console.log("err", err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("NOTIFICATION_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/** 
 * Update Notification        
 * url : /api/admin/Notification/update
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Notification _id
*/
exports.updateNotification = async (req, res) => {

    try {
        let notificationUpdate = await NotificationModel.findOneAndUpdate({ '_id': req.params.id }, { 'emailSubject': req.body.emailSubject, 'emailContent': req.body.emailContent, 'smsContent': req.body.smsContent, 'appType': req.body.appType, 'notificationType': req.body.notificationType, 'notificationContentType': req.body.notificationContentType, 'pushNotificationContent': req.body.pushNotificationContent }, { 'fields': { "_id": 1, "emailSubject": 1, "notificationType": 1, "emailContent": 1, "appType": 1, "smsContent": 1, "notificationContentType": 1, "pushNotificationContent": 1 }, new: true });

        if (notificationUpdate && notificationUpdate.length !== 0) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("NOTIFICATION_DATA_UPDATE_SUCCESS"), 'data': notificationUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("NOTIFICATION_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("NOTIFICATION_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.deleteNotification = async (req, res) => {

    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteNotification = await NotificationModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteNotification) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("NOTIFICATION_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("NOTIFICATION_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.listNotification = async (req, res) => {
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
            condition = { status: _C.status.adminPanel.active };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getNotificationCount = await NotificationModel.find(condition).count();
            res.header('x-total-count', getNotificationCount);
        }
        let getNotificationList = await NotificationModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id emailSubject emailContent smsContent appType notificationType notificationContentType pushNotificationContent').exec();
        if (getNotificationList && getNotificationList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("NOTIFICATION_LIST_SUCCESS"), 'data': getNotificationList });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("NOTIFICATION_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}