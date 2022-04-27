const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config     = require('config');
const _C       = require('../config/constants');

const AvailableCitySchema = new Schema({
  city          : {type:String,required:true,lowercase:true,},
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
    collection: 'cities'
});

module.exports = mongoose.model('AvailableCity', AvailableCitySchema);