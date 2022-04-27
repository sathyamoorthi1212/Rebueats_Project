const PushNotificationModel = require('../../models/PushNotification');
const Config = require('config');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
/** 
 * Add Notification
 * url : /api/admin/PushNotification/add
 * method : POST
 * author : Sathyamoorthi.R                    
*/
exports.addPushNotification = async (req, res) => {
    console.log(req.body)
    try {
        let newDoc = new PushNotificationModel(req.body);
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let pushNotificationDetails = {
                _id: newDoc._id,
                message: newDoc.message,
                userType: newDoc.userType,
                appType: newDoc.appType,
            }
            console.log("notificationDetails", pushNotificationDetails)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PUSH_NOTIFICATION_DATA_SUCCESS"), 'data': pushNotificationDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        console.log("err", err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("PUSH_NOTIFICATION_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};