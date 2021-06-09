const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;


const PromoCodeSchema = new Schema({
    promoName: { type: String, required: true },
    promoCode: { type: String, required: true },
    promoDescription: { type: String },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    expireDate: { type: Date, required: true },
    promoUsed: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        usedCount: { type: Number, default: 0 }
    }],
    promoType: {
        type: Number,
        enum: [_C.status.promoType.percentage, _C.status.promoType.amount,],
        default: _C.status.promoType.percentage,
        required: true
    },
    promoOffer: { type: Number, default: 0 },
    limit: { type: Number, default: 0 },
    minimumOrderAmount: {
        type: Number,
        default: 0
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
        collection: 'promocode'
    });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);