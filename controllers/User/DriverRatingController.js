const UserRoute = require('express').Router();
const DriverRatingModel = require('../../models/DriverRating');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');

/** 
 * Add rating
 * url : /api/user/driverRating/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.add = async (req, res) => {

    try {
        let newDoc = new DriverRatingModel(req.body);
        newDoc.orderId = req.params.orderId;
        newDoc.ratingStatus = true;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let driverRatingDetails = {
                _id: newDoc._id,
                userId: newDoc.userId,
                rating: newDoc.rating,
                comments: newDoc.comments,
                restaurantId: newDoc.restaurantId,
                driverId: newDoc.driverId,
                ratingStatus: newDoc.ratingStatus
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_RATING_DATA_SUCCESS"), 'data': driverRatingDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

    } catch (err) {
        console.log(err);
        /*if (err.code == 11000) {
            err.errmsg = req.i18n.__("DRIVER_RATING_UNIQUE_ERROR");              
        }*/
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};
