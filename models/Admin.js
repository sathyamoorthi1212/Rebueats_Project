const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config     = require('config');
const _C       = require('../config/constants');

const AdminSchema = new Schema({
  name        : { type: String,required: true},
  password    : { type: String, required: true },
  email       : { type: String, unique: true, required: true },
  mobile      : { type: String, unique: true, required: true },
  countryCode : { type: String, default: '+91' },
  role : {
        type : String,
        enum : ['superadmin','admin'],
        required : true
    },
  status      : {
        type: Number,
        enum: [_C.status.admin.active,_C.status.admin.inactive,_C.status.admin.online,_C.status.admin.offline,_C.status.admin.deleted],
        default: _C.status.admin.active,
        required: true
    }

},
{
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
    collection: 'admin'
});

module.exports = mongoose.model('Admin', AdminSchema);