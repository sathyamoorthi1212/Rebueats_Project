const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

function getImage(v) {
  console.log("v", v)
  if (v) {
    return `${Config.server.uri}${_C.path.cuisineImagePath}${v}`;

  } else {
    return null;
  }
}

const CuisineSchema = new Schema({
  cuisineName: { type: String, unique: true, required: true },
  sortOrder: { type: Number, default: 1 },
  cuisineImage: { type: String, get: getImage },
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
    collection: 'cuisine'
  });

module.exports = mongoose.model('Cuisine', CuisineSchema);