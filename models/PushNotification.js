const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

var PushNotificationSchema = new Schema({
    message: { type: String },
    userType: {
        type: Number,
        enum: [_C.status.userPush.partner, _C.status.userPush.customer, _C.status.userPush.driver,_C.status.userPush.all],
        required: true
    },
    appType: {
        type: Number,
        enum: [_C.status.appPush.android, _C.status.appPush.ios, _C.status.appPush.all], required: true
    },
    status: {
        type: Number,
        enum: [_C.status.adminPanel.deleted, _C.status.adminPanel.active],
        default: _C.status.active,
        required: true
    },
}, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
        collection: 'pushNotification'
    });

module.exports = mongoose.model('PushNotification', PushNotificationSchema);