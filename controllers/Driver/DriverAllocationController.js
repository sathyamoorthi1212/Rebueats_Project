const _              = require('lodash');
const Config         = require('config');
const moment         = require('moment');
const _C             = require('../../config/constants');
const logger         = require('../../services/logger');
const DriverModel    = require('../../models/Driver');
const UserModel      = require('../../models/User');
const OrderModel     = require('../../models/Orders');
const DriverAllocationModel     = require('../../models/DriverAllocation');
const HttpStatus = require('http-status-codes');
const chalk_log  = Config.CHALK_LOG;

/** 
 * Assign Driver
 * url : /api/order/assign
 * method : POST
 * author : Sathyamoorthi.R
 * params : DriverId,OrderId
**/
exports.assign = async function(req, res) {
    
    try {
        let driverQuery = { '_id': req.params.driverId/*, status: _C.status.active */};
        let selectFields = 'userName email mobile status otpVerification documentVerification';
        let driver = await new DriverModel().getDriver({ query: driverQuery, fields: selectFields });    
        if (driver.otpVerification === true && driver.documentVerification === true) {
            let bookingQuery = { '_id': req.params.orderId,'status':_C.status.active };
            let selectFields1 = '_id orderCode orderStatus driverId'
            let order = await new OrderModel().getOrder({ query: bookingQuery, fields: selectFields1 });
                    console.log("req",order.orderStatus)

            if (order.orderStatus.code === _C.status.order.confirmed) {
                let request = {
                    orderId    : req.params.orderId,
                    driverId   : req.params.driverId,
                    acceptedAt : { $exists: false },
                    rejectedAt : { $exists: false },
                    status     : true
                };  
                req.body.createdRef = (req.body.createdRef == 1) ? 'Admin' : (req.body.createdRef == 2) ? 'Driver' : 'User';              
                let allocatedRequest = await DriverAllocationModel.findOneAndUpdate(request, req.body.createdRef, { upsert: true, new: true, setDefaultsOnInsert: true });
                if (allocatedRequest) {
                    let notificationContent={
                              'driverId'  :{
                                '_id'       : driver._id,
                                'driverName': driver.userName?driver.userName:""
                               },                              
                              'Orders':{
                                 '_id'        : order._id,
                                 'orderCode'  : order.orderCode?order.orderCode:""
                              },
                              'content'     :`Your order #${order.orderCode} has been assigned to driver`
                    }
                   logger.info((notificationContent));
                   return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ASSIGN_SUCCESSFULLY"), 'data': notificationContent });

                } else {
                    throw { errmsg: 'BOOKING_ALREADY_ASSIGNED' }
                }
            } else {
                throw { errmsg: 'INVALID_BOOKING_DATA' }
            }
        } else {
            throw { errmsg: 'DRIVER_NOT_VERIFIED' }
        }
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ASSIGN_SUCCESSFULLY"), 'data': "userDetails" });
    } catch (err) {
        console.log("err", err);
       return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg),'data':[] });
    }
}

/** 
 * Assign Driver
 * url : /api/order/autoAssign
 * method : POST
 * author : Sathyamoorthi.R
 * params : DriverId,OrderId
**/
exports.autoAssign = async function(req, res) {    

    try {
        let bookingQuery = { '_id': req.params.orderId/*, status: _C.status.active */};
        let selectFields = '_id orderCode orderStatus driverId orderDate dropLocation.coordinates driverId'
        let order = await new OrderModel().getOrder({ query: bookingQuery, fields: selectFields });
        let latitude = order.dropLocation.coordinates.latitude;
                    console.log("_driverslatitude",latitude)

        let longitude = order.dropLocation.coordinates.longitude;

        if (order.orderStatus.code === _C.status.order.confirmed) {
            
            let radiusLimit =Config.RadiusLimit;

            let _drivers = await new DriverModel().getDriverDistance(latitude,longitude,radiusLimit);
            console.log("_drivers",_drivers)
            if (_drivers.length > 0) {
                
                _drivers.map(async driver => {
                    let request = {
                        orderId    : req.params.orderId,
                        driverId   : req.params.driverId,
                        acceptedAt : { $exists: false },
                        rejectedAt : { $exists: false },
                        status     : true
                   };
                    
                    req.body.createdRef = (req.body.createdRef == 1) ? 'Admin' : (req.body.createdRef == 2) ? 'Driver' : 'User';              
                    let allocatedRequest = await DriverAllocationModel.findOneAndUpdate(request, req.body.createdRef, { upsert: true, new: true, setDefaultsOnInsert: true });
                    if (allocatedRequest) {
                        
                        let orderProgress = await OrderModel.findOneAndUpdate({ _id: req.params.orderId }, { 'orderStatus.code': _C.status.order.confirmed }, { new: true });
                    } else {
                            throw { errmsg: 'BOOKING_ASSIGN_FAILED' }
                    }                    
                        
                });
                let responseData = {
                    totalDriverCount: _drivers.length,
                }
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_ASSIGN_SUCCESS"), 'data': responseData });

            } else {
                let responseData = {
                    totalDriverCount: _drivers.length,
                };
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("NO_DRIVER_LIST"), 'data': responseData });
            }
        } else {
            throw { errmsg: 'INVALID_BOOKING_DATA' }
        }
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg),'data':[] });
    }
}

exports.orderAccept = async function(req, res) {
   
    try {
        let bookingQuery = { '_id': req.params.orderId };
        let selectFields = 'orderStatus userId'
        let booking = await new OrderModel().getOrder({ query: bookingQuery, fields: selectFields });
        
        if (booking.orderStatus.code === _C.status.order.confirmed) {
            
            let update = { 'accepted_at': Date.now() };
            let allocatedUpdate = await DriverAllocationModel.findOneAndUpdate({
                'orderId': req.params.orderId,
                'status': true,
                'driverId': req.params.driverId,
                'acceptedAt': { $exists: false },
                'rejectedAt': { $exists: false }
            }, update, { new: true }).exec();
            if (allocatedUpdate != null) {
                let acceptedLocation = { 'coordinates': [parseFloat(req.body.driverLongitude), parseFloat(req.body.driverLatitude)] };
                let updateStatus = { 'orderStatus.code': _C.status.order.accepted, 'orderStatus.acceptedAt': Date.now(), 'orderStatus.acceptedLocation': acceptedLocation, driverId: req.params.driverId /*,tempDriverId: null*/ };

                let orderUpdate = await OrderModel.findOneAndUpdate({ '_id': req.params.orderId }, updateStatus, { new: true }).exec();
                if (orderUpdate) {
                    
                    /*Reject for other drivers*/
                    let rejectCond = { 'orderId': req.params.orderId, 'driverId': { '$ne': req.params.driverId }, status: true };
                    let rejectOtherDriver = await DriverAllocationModel().rejectRemainingDriver({ cond: rejectCond })
                    
                }

                /* Push Notification */
                
                /* Success response */                
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("BOOKING_ACCEPT_SUCCESS")});
            } else {
                
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("INVALID_BOOKING_REQUEST")});
            }
        } else {
            switch (booking.orderStatus.code) {
                case 1:
                    throw { errmsg: 'BOOKING_NOT_ASSIGNED' };
                    break;
                case 3:
                    throw { errmsg: 'BOOKING_ALREADY_ACCEPTED' };
                    break;
                default:
                    throw { errmsg: 'INVALID_BOOKING' };
                    break;
            }
        }
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg),'data':[] });
    }
}

exports.orderReject = async function(req, res) {
    
    try {
        let bookingQuery = { '_id': req.params.orderId };
        let selectFields1 = 'orderCode orderStatus'
        let booking = await new OrderModel().getOrder({ query: bookingQuery, fields: selectFields1 });
        if (booking.orderStatus.code === _C.status.order.confirmed) {
            let driverQuery = { '_id': req.params.driverId /*status: _C.status.active */};
            let selectFields = '_id email mobile userName status';
            let driver = await new DriverModel().getDriver({ query: driverQuery, fields: selectFields });
            let update = { 'rejectedAt': Date.now(), 'rejectedReason': req.body.rejectedReason };

            let allocatedUpdate = await DriverAllocationModel.findOneAndUpdate({
                'orderId': req.params.orderId,
                'status': true,
                'driverId': req.params.driverId,
                'acceptedAt': { $exists: false },
                'rejectedAt': { $exists: false }
            }, update, { new: true }).exec();
            if (allocatedUpdate) {
                                
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("BOOKING_REJECT_SUCCESS")});
            } else {

                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("INVALID_BOOKING_REQUEST")});
            }
        } else {
            throw { errmsg: 'INVALID_BOOKING' }
        }
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg),'data':[] });
    }
}




exports.changeOrderStatus = async function(req, res) {
    
    try {
        let existStatus = (parseInt(req.body.status) === _C.status.order.pickup) ? _C.status.order.accepted : (parseInt(req.body.status) === _C.status.order.ontheway)?_C.status.order.pickup:(parseInt(req.body.status) === _C.status.order.arrived)?_C.status.order.ontheway:(parseInt(req.body.status) === _C.status.order.delivery)?_C.status.order.arrived:_C.status.order.cancal ;
        let updateData = { 'orderStatus.code': parseInt(req.body.status),'orderStatus.datetime': Date.now()};
        console.log("exists",existStatus); 
        driverLocation = { 'coordinates': [parseFloat(req.body.driverLongitude), parseFloat(req.body.driverLatitude)] }; 
        switch (parseInt(req.body.status)) {
                case (_C.status.order.pickup):
                    {
                        //update_data['orderStatus.picked_up_at'] = req.body.picked_up_at;
                        updateData['orderStatus.pickedUpLocation'] = driverLocation;
                        updateData['orderStatus.pickedUpDistance'] = req.body.pickedUpDistance;
                        //updateData['orderStatus.travel_time'] = req.body.travel_time;
                    }
                    break;
                case (_C.status.order.delivered):
                    {
                        // updateData['orderStatus.delivered_at'] = Date.now();
                        updateData['orderStatus.deliveredAt'] = req.body.delivered_at;
                        updateData['orderStatus.deliveredLocation'] = driverLocation;
                    }
                    break;
            } 

        let booking = await OrderModel.findOneAndUpdate({'_id': req.params.orderId,'orderStatus.code': existStatus },updateData,{new:true}).exec(); 
        console.log("SSSSSSSSSSSSSSSSSS",booking);
        if(booking){

               return res.status(HttpStatus.OK).json({ 'success': true,'data':booking, 'message': req.i18n.__(" BOOKING_REJECT_SUCCESS")});
       }
        throw { errmsg: 'INVALID_BOOKING' }

                      
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg),'data':[] });
    }
}
