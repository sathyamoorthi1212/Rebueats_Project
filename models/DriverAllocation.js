const Config                   = require('config');
const mongoose                 = require('mongoose');
const _                        = require('lodash');
const _H                       = require('../services/helper');
const _C                       = require('../config/constants');
const Schema                   = mongoose.Schema;
const ObjectId                 = mongoose.Schema.ObjectId;
const moment                   = require('moment');

var DriverAllocationSchema = new Schema({

    driverId          : { type: ObjectId, ref: 'Driver', required: true },
    orderId           : { type: ObjectId, ref: 'Orders', required: true },
    allocatedAt       : { type: Date, required: true, default: Date.now( ) },
    acceptedAt        : { type: Date },
    rejectedAt        : { type: Date },
    rejectedReason    : { type: String },
    requestExpireTime : { type: Date },
    isDriver          : { type: Number, default: true},
    createdRef        : { type: String },
    status            : { type: Boolean, default: true },    
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
    toObject  : { virtuals: true, getters: true },
    toJSON    : { virtuals: true, getters: true },
    collection: 'driverAllocation'
});

/**
 * @function preSave
 */
DriverAllocationSchema.pre('findOneAndUpdate', async function() {
    var expireMinutes = _C.defaultDriverRequest.expire;
    this._update.requestExpireTime = _H.addTime(this._update.createdAt, expireMinutes, _C.defaultDriverRequest.type);
});

DriverAllocationSchema.methods.rejectRemainingDriver = async function(data) {
    return new Promise(async function(resolve, reject) {
        try {
            var driverAllocation = await mongoose.model('DriverAllocation').update(data.cond, { status: false }, { multi: true });            
            if (driverAllocation) {
                resolve(driverAllocation);
            } else {
                reject({ errmsg: 'DRIVER_REJECT_FAILED' });
            }
        } catch (e) {
            console.log("e", e);
            reject({ errmsg: e.errmsg });
        }
    });
}



module.exports = mongoose.model('DriverAllocation', DriverAllocationSchema);