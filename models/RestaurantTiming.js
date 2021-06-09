const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;
const Config = require('config');
const _C = require('../config/constants');

function toLatLong(v) {
    if (v) {
        return { latitude: v[1], longitude: v[0] };
    }
}

const Timing = Schema({
    days: { type: String, required: true },
    openingTime1: { type: String },
    openingTimeLabel1: { type: String },
    closingTime1: { type: String },
    closingTimeLabel1: { type: String },
    openingTime2: { type: String },
    openingTimeLabel2: { type: String },
    closingTime2: { type: String },
    closingTimeLabel2: { type: String },
    availableTimeStatus: {
        type: Boolean,
        default: false
    }
});

const RestaurantTimingSchema = Schema({
    hours: {
        isSunday: { type: Boolean },
        sunday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isMonday: { type: Boolean},
        monday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isTuesday: { type: Boolean},
        tuesday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isWednesday: { type: Boolean},
        wednesday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isThursday: { type: Boolean},
        thursday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isFriday: { type: Boolean},
        friday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }], isSaturday: { type: Boolean},
        saturday: [{
            _id: false,
            openStatus: { type: Boolean, default: true },
            openingLabel: { type: String },
            opening: { type: Number },
            closing: { type: Number },
            closingLabel: { type: String },
        }],
    },
    restaurantId: { type: ObjectId, ref: 'Restaurant' },
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
        collection: 'restaurantTiming'
    });


module.exports = mongoose.model('RestaurantTiming', RestaurantTimingSchema);