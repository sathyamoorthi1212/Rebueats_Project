const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config     = require('config');
const _C       = require('../config/constants');

const ContactusSchema = new Schema({
  contactusSubject: { type: String },
  contactusName   : { type: String, required: true },
  contactusEmail  : { type: String, required: true },
  contactusMobile : { type: String, required: true },
  contactusMessage: { type: String},
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
    collection: 'contactus'
});

module.exports = mongoose.model('Contactus', ContactusSchema);