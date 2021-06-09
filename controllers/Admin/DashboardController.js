const _ = require('lodash');
const _H = require('../../services/helper');
const _C = require('../../config/constants');
const Moment = require('moment');
const Config = require('config');
const HttpStatus = require('http-status-codes');
const OrderModel = require('../../models/Orders');
const UserModel = require('../../models/User');
const DriverModel = require('../../models/Driver');
const PartnerModel = require('../../models/Partners');


/** 
 * Get Dashboard
 * url : api/admin/dashboard
 * method : GET
 * author : Sathyamoorthi.R
**/

exports.dashboard = async function(req, res) {
    try {
        var userDataCount = {};
        var bookingDataCount = {};
        var driverDataCount = {}; 
        var partnerDataCount = {};        

        /* User data count - Get all valid active users */
        let users = await UserModel.find({ 'status':{ $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }).select('createdAt otpVerification').lean().exec();

        /* Filter users createed after start of the day and month */
        let todayUser = 0;
        let monthlyUser = 0;
        _.map(users, function(user) {
            let isToday = Moment(user.createdAt).isAfter(Moment().startOf('day'));
            let isMonth = Moment(user.createdAt).isAfter(Moment().startOf('month'));

            monthlyUser = (isMonth) ? +monthlyUser + 1 : monthlyUser;
            todayUser = (isToday) ? +todayUser + 1 : todayUser;
        });
        userDataCount.totalUser = users.length;
        userDataCount.todayUser = todayUser;
        userDataCount.monthlyUser = monthlyUser;

        /* Count users based on otp verification */
        let userCountOtp = _.countBy(users, 'otpVerification');
        userDataCount.verifiedUser = userCountOtp[_C.status.otpVerify.verified];
        userDataCount.unverifiedUser = userCountOtp[_C.status.otpVerify.notVerified];

        /* --- User data count end */

        /* Bookings - Get all OrderModel*/
        let bookings = await OrderModel.find({ 'status': _C.status.active }).select('orderStatus.code paymentReceived totalFee createdAt').lean().exec();

        /* Filter booking created after start of the day and month */
        let todayBooking = [];
        let monthlyBooking = [];
        _.map(bookings, function(booking) {
            let isToday = Moment(booking.createdAt).isAfter(Moment().startOf('day'));
            let isMonth = Moment(booking.createdAt).isAfter(Moment().startOf('month'));
            if (isToday) {
                todayBooking.push(booking);
            }

            if (isMonth) {
                monthlyBooking.push(booking);
            }
        });


        let bookingcountBy = _.countBy(bookings, 'orderStatus.code');
        console.log("bookingcountBy",bookingcountBy);

        bookingDataCount.pendingBookings = bookingcountBy[_C.status.order.pending];
        bookingDataCount.deliveredBookings = bookingcountBy[_C.status.order.delivery];
        bookingDataCount.rejectedBookings = bookingcountBy[_C.status.order.cancel];
        bookingDataCount.confirmedBookings = bookings.length - (+bookingDataCount.pendingBookings + +bookingDataCount.deliveredBookings + +bookingDataCount.rejectedBookings);
        bookingDataCount.totalBookings = bookings.length;

        bookingDataCount.todayBooking = todayBooking.length;
        bookingDataCount.monthlyBooking = monthlyBooking.length;



        /* Get payment completed orders  and sum their delivery charge */
        /*let paid_bookings = _.filter(bookings, ['payment_received', _C.status.active]);
        let total_booking_amount = _.sumBy(paid_bookings, 'delivery_charge.total_fee') || 0;

        let today_paid_bookings = _.filter(today_booking, ['payment_received', _C.status.active]);
        let today_booking_amount = _.sumBy(today_paid_bookings, 'delivery_charge.total_fee') || 0;

        let monthly_paid_bookings = _.filter(monthly_booking, ['payment_received', _C.status.active]);
        let monthly_booking_amount = _.sumBy(monthly_paid_bookings, 'delivery_charge.total_fee') || 0;

        booking_sales.total_booking_amount = _H.round(total_booking_amount, 2);
        booking_sales.today_booking_amount = _H.round(today_booking_amount, 2);
        booking_sales.monthly_booking_amount = _H.round(monthly_booking_amount, 2);*/



        /* -- Bookings count end -- */

        /* Driver data count - Get drivers count */
        let drivers = await DriverModel.find({ 'status':{ $in: [_C.status.driver.active, _C.status.driver.offline, _C.status.driver.online] } }).select('status otpVerification createdAt').lean().exec();
        /* Filter users createed after start of the day and month */
        let todayDriver = 0;
        let monthlyDriver = 0;
        _.map(drivers, function(driver) {
            let isToday = Moment(driver.createdAt).isAfter(Moment().startOf('day'));
            let isMonth = Moment(driver.createdAt).isAfter(Moment().startOf('month'));
            monthlyDriver = (isMonth) ? +monthlyDriver + 1 : monthlyDriver;
            todayDriver = (isToday) ? +todayDriver + 1 : todayDriver;
        });


        let driverStatusCount = _.countBy(drivers, 'otpVerification');        
        driverDataCount.verifiedDriver = driverStatusCount[_C.status.otpVerify.verified];
        driverDataCount.unverifiedDriver = driverStatusCount[_C.status.otpVerify.notVerified];
        driverDataCount.totalDrivers = drivers.length;
        driverDataCount.todayDriver = todayDriver;
        driverDataCount.monthlyDriver = monthlyDriver;
        /* End Driver data count */

        /* Partner data count - Get partners count */
        let partners = await PartnerModel.find({ 'status':{ $in: [_C.status.user.active, _C.status.user.offline, _C.status.user.online] } }).select('status otpVerification createdAt').lean().exec();
        /* Filter users createed after start of the day and month */
        let todayPartner = 0;
        let monthlyPartner = 0;
        _.map(partners, function(partner) {
            let isToday = Moment(partner.createdAt).isAfter(Moment().startOf('day'));
            let isMonth = Moment(partner.createdAt).isAfter(Moment().startOf('month'));
            monthlyPartner = (isMonth) ? +monthlyPartner + 1 : monthlyPartner;
            todayPartner = (isToday) ? +todayPartner + 1 : todayPartner;
        });


        let partnerStatusCount = _.countBy(partners, 'otpVerification');        
        partnerDataCount.verifiedPartner = partnerStatusCount[_C.status.otpVerify.verified];
        partnerDataCount.unverifiedPartner = partnerStatusCount[_C.status.otpVerify.notVerified];
        partnerDataCount.totalPartners = partners.length;
        partnerDataCount.todayPartner = todayPartner;
        partnerDataCount.monthlyPartner = monthlyPartner;
        /* End Driver data count */

        /* Delivery sales */
        /*var payment_record = await BookingPaymentReportModel.find({}).select('driver_commission_amount createdAt').lean().exec();

        let today_delivery = [];
        let monthly_delivery = [];
        _.map(payment_record, function(delivery) {
            let isToday = Moment(delivery.createdAt).isAfter(Moment().startOf('day'));
            let isMonth = Moment(delivery.createdAt).isAfter(Moment().startOf('month'));
            if (isToday) {
                today_delivery.push(delivery);
            }

            if (isMonth) {
                monthly_delivery.push(delivery);
            }
        });

        let monthly_amount = _.sumBy(monthly_delivery, 'driver_commission_amount') || 0;
        let daily_amount = _.sumBy(today_delivery, 'driver_commission_amount') || 0;
        let total_amount = _.sumBy(payment_record, 'driver_commission_amount') || 0;


        delivery_sales.monthly_amount = _H.round(monthly_amount,2);
        delivery_sales.daily_amount = _H.round(daily_amount,2);
        delivery_sales.total_amount = _H.round(total_amount,2);*/

             var showData={
                user: userDataCount,
                booking: bookingDataCount,
                driver: driverDataCount,
                partner: partnerDataCount,
               /* booking_sales: booking_sales,
                delivery_sales: delivery_sales*/
            }
        
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DASHBOARD_LIST_SUCESSFULLY"), 'data': showData });
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}

/** 
 * Get Monthly statistics Chart
 * url : api/admin/statistics-chart
 * method : GET
 * author : Sathyamoorthi.R
**/
exports.statisticsMonthChart= async function(req, res) {

    try{

        var currentTime = new Date();
        var currentYear = currentTime.getFullYear();
        var getData = await UserModel.aggregate([
            {
               $match: { createdAt: { "$gte": new Date(currentYear + "-01-01"), "$lt": new Date(currentYear + "-12-31") }}
             },
             { $group: {
                  _id   : { $month: "$createdAt" },
                  total : {"$sum":1}                 
             }},
            ]);
         var getMonthlyReport=_.sortBy(getData, '_id');

         return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_MONTHLY_REORT"), 'data':getMonthlyReport });

    } catch (err) {
        console.log("err", err);
       return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }    
}

/** 
 * Get Yearly statistics Chart
 * url : api/admin/statistics-chart
 * method : GET
 * author : Sathyamoorthi.R
**/
exports.statisticsYearChart= async function(req, res) {

    try{

        var currentTime = new Date();
        var currentYear = currentTime.getFullYear();
        var getData = await OrderModel.aggregate([
            {
               $match: { createdAt: { "$gte": new Date(currentYear + "-01-01"), "$lt": new Date(currentYear + "-12-31") }}
             },
             { $project:{
                'status':'$orderStatus.code',
                'createdAt':1
                
             }},
             { $group: {
                  _id        : { $year: "$createdAt" },
                  total      : {"$sum":1},                 
                  completed  : {$sum: {$cond: [{$eq:["$status", 7]}, 1, 0]}},
                  pending    : {$sum: {$cond: [{$eq:["$status", 1]}, 1, 0]}},
                  confirmed  : {$sum: {$cond: [{$eq:["$status", 2]}, 1, 0]}},
                  canceled   : {$sum: {$cond: [{$eq:["$status", 8]}, 1, 0]}}                  
             }},
            ]);
         return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_YEAR_REORT"), 'data':getData });

    } catch (err) {
        console.log("err", err);
       return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }    
}