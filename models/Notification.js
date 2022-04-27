const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;


const NotificationSchema = new Schema({
    emailSubject: { type: String },
    emailContent: { type: String },
    smsContent: { type: String },
    pushNotificationContent: { type: String },
    appType: {
        type: Number,
        enum: [_C.status.app.admin, _C.status.app.customer, _C.status.app.driver],
        required: true,
        default: _C.status.app.customer
    },
    notificationType: {
        type: Array,
        enum: [_C.status.notificationType.email, _C.status.notificationType.sms,
        _C.status.notificationType.pushNotification],
        required: true,
    },
    notificationContentType: {
        type: Number,
        required: true,
    },
    notificationContentStatus:{
        type:Number,
        enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
        default: _C.status.adminPanel.active,
        required: true
    },
    status: {
        type: Number,
        enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
        default: _C.status.adminPanel.active,
        required: true
    },
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'notification'
    });

module.exports = mongoose.model('notification', NotificationSchema);