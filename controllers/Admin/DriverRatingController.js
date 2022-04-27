const UserRoute = require('express').Router();
const DriverRatingModel = require('../../models/DriverRating');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
const _ = require('lodash');

/** 
 * Get DriverRating
 * url : /api/admin/driverRating/listDriverRating
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of RestaurantRating _id
*/
exports.listDriverRating = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        console.log("sortQuery", sortQuery)
        let listDriverRating = await DriverRatingModel.aggregate([
            { $sort: sortQuery }, {
                $lookup: {
                    from: 'user',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'data'
                }
            }, {
                $unwind: {
                    path: "$data",
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $lookup: {
                    from: 'restaurant',
                    localField: 'restaurantId',
                    foreignField: '_id',
                    as: 'value'
                }
            },
            {
                $unwind: {
                    path: "$value",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'driver',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'result'
                }
            },
            {
                $unwind: {
                    path: "$result",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'order',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'order'
                }
            }, {
                $unwind: {
                    path: "$order",
                    preserveNullAndEmptyArrays: true
                }
            }, { $match: { "status": _C.status.adminPanel.active } },
            {
                $project: {
                    user: {
                        id: {
                            $cond: ['$data._id', '$data._id', " "]
                        },
                        username: {
                            $cond: [{ $concat: ["$data.firstName", " ", "$data.lastName"] }, { $concat: ["$data.firstName", " ", "$data.lastName"] }, " "]
                        }
                    },
                    restaurant: {
                        id: {
                            $cond: ["$value._id", "$value._id", " "]
                        },
                        restaurantName: {
                            $cond: ["$value.restaurantName", "$value.restaurantName", " "]
                        }
                    },
                    driver: {
                        id: {
                            $cond: ["$result._id", "$result._id", " "]
                        },
                        driverName: {
                            $cond: ["$result.userName", "$result.userName", " "]
                        },
                    },
                    orders: {
                        id: {
                            $cond: ["$order._id", "$order._id", " "]
                        },
                        orderCode: {
                            $cond: ["$order.orderCode", "$order.orderCode", " "]
                        },
                    },
                    rating: 1,
                    comments: 1
                }
            }, { $match: likeQuery },
            { $skip: pageQuery.skip },
            { $limit: pageQuery.take }]).exec();

        console.log("listDriverRating", listDriverRating)

        if (listDriverRating && listDriverRating.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_RATING_LIST_SUCCESS"), 'data': listDriverRating });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_RATING_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("errrrrrrrrrrr", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

/** 
 * Get DriverRatingOne
 * url : /api/admin/driverRating/getDriverRatingOne
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of DriverRating _id
*/
exports.getDriverRatingOne = async (req, res) => {
    try {
        if (req.params.id) {
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }

        let getDriverRatingOne = await DriverRatingModel.find(condition)
            .select('_id rating comments userId restaurantId driverId orderId  ')
            .populate('userId', 'firstName lastName')
            .populate('restaurantId', 'restaurantName')
            .populate('driverId', 'userName')
            .populate('orderId', 'orderCode')
            .exec();
        console.log(getDriverRatingOne);
        var fullname = _.map(getDriverRatingOne, function (o) {
            console.log(o);
            return {
                userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                _id: o._id,
                rating: o.rating,
                comments: o.comments,
                restaurantName: o.restaurantId.restaurantName ? o.restaurantId.restaurantName : " ",
                driverName: o.driverId.userName ? o.driverId.userName : " ",
                orderCode: o.orderId.orderCode ? o.orderId.orderCode : " "

            }

        })

        if (getDriverRatingOne && getDriverRatingOne.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_RATING_LIST_SUCCESS"), 'data': fullname });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_RATING_NOT_FOUND") });
    } catch (err) {
        console.log("errrrrrrrrrrr", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/** 
 * Delete DriverRating
 * url : /api/admin/driverRating/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of DriverRating _id
*/
exports.delete = async (req, res) => {
    console.log("rrrrrrrr", req.params.id);

    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        console.log("cccccc", condition)
        let deleteDriverRating = await DriverRatingModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });
        console.log("deleteDriverRating", deleteDriverRating);

        if (deleteDriverRating) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_RATING_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_RATING_NOT_FOUND") });

        }


    } catch (err) {
        console.log(err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await DriverRatingModel.findOneAndUpdate({ '_id': req.params.DriverRatingId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DRIVER_RATING_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DRIVER_RATING_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};