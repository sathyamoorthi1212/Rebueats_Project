const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = Schema.Types.ObjectId;
const Validation = require('../config/validation');


function toLatLong(v) {
    if (v) {
        return { latitude: v[1], longitude: v[0] };
    }
}

let statusLocation = Schema({
    type: { type: String, required: true, enum: 'Point', default: 'Point' },
    coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
}, { _id: false });

const OrdersSchema = new Schema({
    orderCode: { type: String, required: true },
    userId: { type: ObjectId, ref: 'User' },
    driverId: { type: ObjectId, ref: 'Driver' },
    restaurantId: { type: ObjectId, required: true, ref: 'Restaurant' },
    pickupLocation: {
        type: { type: String, required: true, enum: 'Point', default: 'Point' },
        coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
    },
    dropLocation: {
        type: { type: String, required: true, enum: 'Point', default: 'Point' },
        coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
    },
    dropAddress: { type: String },
    dropDetailAddress: { type: String },
    paymentMethod: { type: Number, enum: [_C.status.payment.cod, _C.status.payment.paypal, _C.status.payment.paytm] },
    paymentType: { type: Number, enum: [_C.status.payment.offline, _C.status.payment.online] },
    paymentReceived: { type: Number, enum:[_C.status.paymentReceived.received, _C.status.paymentReceived.notReceived], default: _C.status.paymentReceived.notReceived },
    paymentDetail: { type: Array },
    tax: { type: Number },
    deliveryFee: { type: Number, default: 0 },
    orderDate: { type: Date, default: Date.now() },
    notes: { type: String },
    signature: { type: String/*, get: getImage*/ },
    items: { type: Array },
    deliveryType: { type: String },
    deliveryNotes: { type: String },
    subTotal: { type: Number },
    total: { type: Number },
    promotion: { type: Number },
    promoCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    orderStatus: {
        code: { type: Number, enum: [_C.status.order.pending, _C.status.order.confirmed, _C.status.order.AcceptedReject, _C.status.order.Arrived, _C.status.order.Pickup, _C.status.order.Ontheway, _C.status.order.delivery], default: _C.status.order.pending },
        datetime: { type: Date },
        confirmedAt: { type: Date },
        acceptedAt: { type: Date },
        arrivedAt: { type: Date },
        pickedUpAt: { type: Date },
        deliveredAt: { type: Date },
        acceptedLocation: statusLocation,
        pickedUpLocation: statusLocation,
        pickedUpDistance: { type: Number, default: 0 },
        //travelTime: { type: Number, default: 0 },
        cancelReasonId: { type: ObjectId, ref: 'CancelReason' },
        cancelled_ref: { type: String },
        //cancelled_by: { type: ObjectId, refPath: 'cancelled_ref' },
        message: { type: String }
    },
    status: {
        type: Number,
        enum: [_C.status.admin.active, _C.status.admin.inactive, _C.status.admin.deleted],
        default: _C.status.admin.active,
        required: true
    }

},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'order'
    });


OrdersSchema.methods.getOrder = async (data) => {
    return new Promise(async function (resolve, reject) {
        try {
            let order = await orderModel.find(data.query, data.select).limit(1).exec();
            if (order && order.length > 0) {
                return resolve(order[0]);
            } else {
                return reject({ errmsg: 'INVALID_BOOKING' });
            }
        } catch (err) {
            return reject(err);
        }
    });
}

OrdersSchema.index({ dropLocation: '2dsphere' });
let orderModel = mongoose.model('Booking', OrdersSchema);
module.exports = orderModel;