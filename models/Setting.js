var mongoose = require('mongoose');
var Config = require('config');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;
const _C = require('../config/constants');

function getImage(v) {
    if (v) {
        return `${Config.server.uri}${_C.path.siteImagePath}${v}`;
    } else {
        return null;
    }
}

let SettingSchema = new Schema({
    siteKey: { type: String, required: true, unique: true },
    social_info: {
        socialFacebook: { type: String },
        socialTwitter: { type: String },
        socialGoogle: { type: String },
        socialLinkedin: { type: String },
        socialInstagram: { type: String },
    },
    siteInfo: {
        siteName: { type: String },
        siteTag: { type: String },
        siteLogo: { type: String, get: getImage },
        siteContactEmail: { type: String },
        siteContactNumber: { type: String },
        siteContactAddress: { type: String },
        //radiusLimit          : { type: String },    
        defaultCurrency: { type: ObjectId, ref: 'Currency' },
        //default_language      : { type: ObjectId, ref: 'Language' },
        siteStatus: { type: Number, enum: [0, 1], default: 1 },
    },
    smtpSetting: {
        smtpHost: { type: String },
        smtpEncryption: { type: String, enum: ['ssl', 'tls'], default: 'ssl' },
        smtpPort: { type: Number },
        smtpUsername: { type: String },
        smtpPassword: { type: String },
        smtpEmail: { type: String },
        smtpName: { type: String },
        smtpStatus: { type: Number, enum: [0, 1], default: 1 },
    },
    smsSetting: {
        smsGatewayId: { type: String },
        smsGatewayToken: { type: String },
        smsGatewayNumber: { type: String },
        smsStatus: { type: Number, enum: [0, 1], default: 1 },
    },
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        toObject: { virtuals: true, getters: true },
        toJSON: { virtuals: true, getters: true },
        collection: 'setting'
    });


let settingModel = mongoose.model('Setting', SettingSchema);

module.exports = settingModel;