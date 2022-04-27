const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

const CurrencySchema = new Schema({
    currencyName: { type: String, required: true },
    currencySymbol: { type: String, required: true },
    baseCurrency: { type: Number, default: '' },
    currencyCode: { type: String,  default: '' },
    currencyValue: { type: Number, default: '' },
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
        collection: 'currency'
    });

module.exports = mongoose.model('Currency', CurrencySchema);