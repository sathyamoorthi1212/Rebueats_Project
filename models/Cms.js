const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

var CmsSchema = new Schema({
    cmsTitle: { type: String, required: true },
    cmsDescription: { type: String },
    cmsUrl: { type: String },
    appType: {
        type: Number,
        enum: [_C.status.app.admin, _C.status.app.customer, _C.status.app.driver],
        required: true
    },
    cmsType: {
        type: Number,
        enum: [_C.status.cms.aboutUs, _C.status.cms.privacyPolicy, _C.status.cms.termsAndConditions, _C.status.cms.others], required: true
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
        collection: 'cms'
    });

module.exports = mongoose.model('Cms', CmsSchema);