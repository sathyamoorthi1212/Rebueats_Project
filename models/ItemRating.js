const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;


const ItemRatingSchema = new Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    foodId: { type: ObjectId, ref: 'RestaurantMenu', required: true },
    restaurantId: { type: ObjectId, required: true, ref: 'Restaurant' },
    rating: { type: Boolean },
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
        collection: 'itemRating'
    });

module.exports = mongoose.model('ItemRating', ItemRatingSchema);