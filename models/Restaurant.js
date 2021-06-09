const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;
const Config = require('config');
const _C = require('../config/constants');
var mongoosePaginate = require('mongoose-paginate');


function toLatLong(v) {
    if (v) {
        return { latitude: v[1], longitude: v[0] };
    }
}

function getImage(v) {
    console.log("v", v)
    if (v) {
        return `${Config.server.uri}${_C.path.restaurantImagePath}${v}`;
        // return `${server_info.uri}${_C.path.folder.user_image_path}${v}`;
    } else {
        return null;
    }
}

const Location = Schema({
    type: { type: String, required: true, enum: 'Point', default: 'Point' },
    coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
}, { _id: false });


const RestaurantSchema = Schema({
    restaurantName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    mobile: { type: String, unique: true, required: true },
    address: { type: String, default: "" },
    faltNumber: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    countryCode: { type: String, default: '+91' },
    logo: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    costForTwo: { type: Number },
    couponCode: { type: String },
    itemTaxPercentage: { type: Number, default: 5 },          /*Tax Percentage*/
    itemTaxAmount: { type: Number, default: 0.05 },       /*Tax Amount*/
    cuisineId: [{ type: ObjectId, ref: 'Cuisine' }],
    userId: [{ type: ObjectId, ref: 'User' }],
    deliveryTime: { type: Number },
    deliveryTimeLabel: { type: String },
    preparingTime: { type: String },
    partnerId: { type: ObjectId, ref: 'Partners' },
    isVeg: { type: Boolean },
    deliveryCharge: { type: Number, default: 15.00 },
    offer: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    pickupTime: { type: Date },
    freeDelivery: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no',
        required: true
    },
    rating: { type: Number },
    favouriteCount: { type: Number },
    paymentMethod: {
        type: Number,                                /*1-Cash & Online,2-Online*/
        enum: [1, 2],
        default: 1,
        required: true
    },
    restaurantTimingId: { type: ObjectId, ref: 'RestaurantTiming' },
    addtionalNote: { type: String },
    minimumOrderValue: { type: Number, default: 0 },
    takeawayHours: { type: Date },
    itemName: { type: String },
    itemDescription: { type: String },
    restaurantImage: { type: String, get: getImage },
    restaurantLocation: {
        type: { type: String, required: true, enum: 'Point', default: 'Point' },
        coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
    },
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
        collection: 'restaurant'
    });

RestaurantSchema.index({ restaurantLocation: '2dsphere' });
RestaurantSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Restaurant', RestaurantSchema);