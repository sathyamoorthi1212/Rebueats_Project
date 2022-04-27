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

const RestaurantMenuSchema = Schema({
    restaurantId: { type: ObjectId, required: true, ref: 'Restaurant' },
    status: {
        type: Number,
        enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
        default: _C.status.adminPanel.active,
        required: true
    },
    tag: [
        {
            _id: false,
            tagId: { type: ObjectId },
            tagName: { type: String },
            status: {
                type: Number,
                enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
                default: _C.status.adminPanel.active,
                required: true
            }

        }],
    menus: [{
        _id: false,
        name: { type: String },
        tag: [{
            _id: false,
            tagId: { type: ObjectId },
            tagName: { type: String }
        }],
        menuId: { type: ObjectId },
        status: {
            type: Number,
            enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
            default: _C.status.adminPanel.active,
            required: true
        }
    }],
    itemDetails: [
        {
            _id: false,
            foodId: { type: ObjectId },
            name: { type: String },
            description: { type: String },
            itemImage: { type: String },
            addtionalNote: { type: String },
            isVeg: { type: Boolean, default: false },
            isPackage: { type: Boolean, default: false },
            availableStatus: {
                type: Number,
                enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
                default: _C.status.adminPanel.active,
            },
            quantity: { type: Number, default: 0 },
            itemStatus: {
                type: Number,
                enum: [1, 2],
                default: 1,
            },
            addOns: { type: String, default: "" },
            packagingCharges: { type: Number, default: 0 },
            tag: [{
                _id: false,
                tagName: { type: String, required: true },
                tagId: { type: ObjectId }
            }],
            size: [{
                _id: false,
                sizeName: { type: String },
                sizeId: { type: ObjectId },
                price: { type: Number }
            }],
            multiSize: [{
                _id: false,
                sizeName: { type: String },
                sizeId: { type: ObjectId },
                price: { type: Number }
            }],
            price: { type: Number },
            availableFrom: { type: Number },
            availableTo: { type: Number },
            availableFromLabel: { type: String },
            availableToLabel: { type: String },
            status: {
                type: Number,
                enum: [_C.status.adminPanel.active, _C.status.adminPanel.inactive, _C.status.adminPanel.deleted],
                default: _C.status.adminPanel.active,
                required: true
            }
        }
    ],
    //ingredients        : { type:String},
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'restaurantFoodItem'
    });

RestaurantMenuSchema.methods.getFood = async (req, res) => {
    return new Promise(async function (resolve, reject) {
        try {
            console.log("cond", req.cond)
            let getFood = await restaurantFoodModel.find(req.cond, req.select).limit(1).exec();
            console.log("getFood", getFood)
            if (getFood && getFood.length > 0) {
                resolve(getFood[0]);
            } else {
                reject({ errmsg: 'INVALID_DETAILS' });
            }
        } catch (e) {
            console.log(e)
            reject({ errmsg: e.errmsg });
        }
    });
}

let restaurantFoodModel = mongoose.model('RestaurantMenu', RestaurantMenuSchema)
module.exports = restaurantFoodModel;
