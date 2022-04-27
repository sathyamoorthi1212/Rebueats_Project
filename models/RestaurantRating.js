const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;


const RestaurantRatingSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  orderId: { type: ObjectId, ref: 'Orders', required: true },
  restaurantId: { type: ObjectId, required: true, ref: 'Restaurant' },
  rating: { type: Number, required: true },
  comments: { type: String },
  ratingStatus: { type: Boolean, default: false },
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
    collection: 'restaurantRating'
  });

module.exports = mongoose.model('RestaurantRating', RestaurantRatingSchema);