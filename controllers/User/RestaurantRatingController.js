const UserRoute = require('express').Router();
const RestaurantRatingModel = require('../../models/RestaurantRating');
const ItemRatingModel = require('../../models/ItemRating');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');

/** 
 * Add rating
 * url : /api/admin/restaurantRating/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.add = async (req, res) => {

    try {
        let newDoc = new RestaurantRatingModel(req.body);
        console.log("req.body", req.body);
        newDoc.orderId = req.params.orderId;
        newDoc.ratingStatus = true;
        newDoc = await newDoc.save();

        if (newDoc && newDoc.length !== 0) {
            let restaurantRatingDetails = {
                _id: newDoc._id,
                userId: newDoc.userId,
                rating: newDoc.rating,
                comments: newDoc.comments,
                restaurantId: newDoc.restaurantId,
                ratingStatus: newDoc.ratingStatus
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURTANT_RATING_DATA_SUCCESS"), 'data': restaurantRatingDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

    } catch (err) {
        console.log(err);
        /*if (err.code == 11000) {
            err.errmsg = req.i18n.__("CUISINE_UNIQUE_ERROR");              
        }*/
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.addItemRating = async (req, res) => {
    try {
        let newDoc = new ItemRatingModel(req.body);
        newDoc.foodId = req.params.foodId;
        console.log("req.body", req.body);
        newDoc.ratingStatus = true;
        newDoc = await newDoc.save();
        if (newDoc && newDoc.length !== 0) {
            let itemRatingDetails = {
                _id: newDoc._id,
                userId: newDoc.userId,
                rating: newDoc.rating,
                foodId: newDoc.foodId,
                restaurantId: newDoc.restaurantId,
                ratingStatus: newDoc.ratingStatus
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ITEM_RATING_DATA_SUCCESS"), 'data': itemRatingDetails });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
