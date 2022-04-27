const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config     = require('config');
const _C       = require('../config/constants');

const CategorySchema= Schema({
  categoryName   : { type: String,unique: true,required: true},
  sortOrder     : { type: Number, default: 1},
  status        : {
            type: Number,
            enum: [_C.status.adminPanel.active,_C.status.adminPanel.inactive,_C.status.adminPanel.deleted],
            default: _C.status.adminPanel.active,
            required: true
  },

},
{
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
    collection: 'category'
});

module.exports = mongoose.model('Category', CategorySchema);