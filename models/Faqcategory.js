const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

const FaqcategorySchema = new Schema({
    faqCategoryName: { type: String, required: true },
    status: {
        type: Number,
        enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
        default: _C.status.adminPanel.active,
        required: true,
    },
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'faqcategory'
    });

module.exports = mongoose.model('Faqcategory', FaqcategorySchema);
