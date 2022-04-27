const Mongoose    = require('mongoose');
const Schema      = Mongoose.Schema;
const ObjectId    = Mongoose.Schema.ObjectId;
const _C          = require('../config/constants');
const _H          = require('../services/helper');
const DriverModel = require('../models/Driver');

let DriverPaymentReportSchema = new Schema({
	driverId              : { type: ObjectId, ref: 'Driver' },
	totalOrders           : { type: Number, default: 0 },
	totalCashOrders       : { type: Number, default: 0 },
	totalOnlineOrders     : { type: Number, default: 0 },
	driverInhandAmount    : { type: Number, default: 0 },
	driverCommissionAmount: { type: Number, default: 0 },
	driverPayoutAmount    : { type: Number, default: 0 },
	orderPaymentMethod    : { type: Number, enum: [_C.type.driverPaymentMethod.cash, _C.type.driverPaymentMethod.online], default: _C.type.driverPaymentMethod.online },
	driverPaymentStatus   : { type: Number, enum: [_C.status.driverPaymentStatus.pending, _C.status.driverPaymentStatus.completed], default: _C.status.driverPaymentStatus.pending },	
}, {
	timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
	versionKey: false,
	toObject  : { virtuals: true, getters: true },
	toJSON    : { virtuals: true, getters: true },
	collection: 'driverPaymentReport'
});

DriverPaymentReportSchema.methods.addDriverPaymentReport = async function(booking) {
    return new Promise(async function(resolve, reject) {
        try {

        	let driverInhandAmount = 0, driverCommission = 0, deliveryFee = 0, driverCommissionAmount = 0, driverPayoutAmount = 0;
        	/* Get Driver Commission */
        	let driver = await DriverModel.find({ _id: booking.driverId }, 'commission').limit(1).exec();
        	/* Booking Payment Method */
        	let OrderPaymentMethod = (booking.paymentType === _C.status.paymentType.offline) ? _C.status.paymentType.offline : _C.status.paymentType.online;


        	/* Driver Inhand Amount */
        	if(OrderPaymentMethod === _C.status.paymentType.offline){
                driverInhandAmount = (booking.total) ? booking.total : 0;
        		driverInhandAmount = +(Math.round(Number(driverInhandAmount)+'e+2')+'e-2');
        	}
        	/* Driver Commission */
        	driverCommission = (driver && driver.length > 0 && driver[0].commission > 0) ? driver[0].commission : await _H.getDriverCommission();
        	/* Driver Commission Calculation */
        	deliveryFee = (booking.deliveryFee > 0) ? booking.deliveryFee : 0;
        	driverCommissionAmount = (driverCommission / 100) * deliveryFee;
            driverCommissionAmount = +(Math.round(Number(driverCommissionAmount)+'e+2')+'e-2');
        	/* Driver Payout Calculation */
        	if(OrderPaymentMethod === _C.status.paymentType.offline){
        		driverPayoutAmount = (driverInhandAmount > 0) ? (driverInhandAmount - driverCommissionAmount) : 0;
                driverPayoutAmount = +(Math.round(Number(driverPayoutAmount)+'e+2')+'e-2');
        	}

        	/* Driver Payment Report */
            let cond = { driverId: booking.driverId, orderPaymentMethod: OrderPaymentMethod, driverPaymentStatus: _C.status.driverPaymentStatus.pending };

            let updateData = {
            	driverId: booking.driverId,
            	totalOrders: 1,
            	totalCashOrders: (OrderPaymentMethod === _C.status.paymentType.offline) ? 1 : 0,
            	totalOnlineOrders: (OrderPaymentMethod === _C.status.paymentType.online) ? 1 : 0,
            	driverInhandAmount: driverInhandAmount,
            	driverCommissionAmount: (driverCommissionAmount > 0) ? driverCommissionAmount : 0,
            	driverPayoutAmount: (driverPayoutAmount > 0) ? driverPayoutAmount : 0,
            	orderPaymentMethod: OrderPaymentMethod
            }
            /* If Pending Payment exists update */
            let paymentReport = await driverPaymentReportModel
            	.findOneAndUpdate(cond, {
            		$inc: {
            			totalOrders: updateData.totalOrders,
            			totalCashOrders: updateData.totalCashOrders,
            			totalOnlineOrders: updateData.totalOnlineOrders,
            			driverInhandAmount: updateData.driverInhandAmount,
            			driverCommissionAmount: updateData.driverCommissionAmount,
            			driverPayoutAmount: updateData.driverPayoutAmount
            		}
            	}, { new: true }).exec();
            	if(paymentReport) {
            		/* Resolved */
            		resolve(paymentReport);
            	} else {
            		/* If Pending Payment not exists add */
            		let saveData = new driverPaymentReportModel(updateData);
            		saveData = await saveData.save();
            		resolve(saveData);
            	}
        } catch(err) {
            console.log("err", err);
            reject((err && err.errmsg) ? err.errmsg : "")
        }
    })
}

let driverPaymentReportModel = Mongoose.model('DriverPaymentReport', DriverPaymentReportSchema);

module.exports = driverPaymentReportModel;