const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;

const FaqSchema = new Schema(
    {
        faqcategoryId: { type: ObjectId, ref: 'Faqcategory', required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
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
        collection: 'faq'
    });

module.exports = mongoose.model('Faq', FaqSchema);
