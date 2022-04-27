const UserRoute = require('express').Router();
const RestaurantRatingModel = require('../../models/RestaurantRating');
const ItemRatingModel = require('../../models/ItemRating');
const Config = require('config');
const objectId = require('mongoose').Types.ObjectId;
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const HelperFunc = require('./Function');
const _ = require('lodash');

/** 
 * Get RestaurantRating
 * url : /api/admin/restaurantRating/listRestaurantRating
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of RestaurantRating _id
*/
exports.listRestaurantRating = async (req, res) => {
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
        let listRestaurantRating = await RestaurantRatingModel.aggregate([
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
            }, {
                $unwind: {
                    path: "$value",
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
            },
            { $match: { "status": _C.status.adminPanel.active } },
            {
                $project: {
                    user: {
                        id: {
                            $cond: ['$data._id', '$data._id', " "]
                        },
                        username: {
                            $cond: [{ $concat: ["$data.firstName", " ", "$data.lastName"] }, { $concat: ["$data.firstName", " ", "$data.lastName"] }, " "]
                        },
                    },
                    restaurant: {
                        id: {
                            $cond: ["$value._id", "$value._id", " "]
                        },
                        restaurantName: {
                            $cond: ["$value.restaurantName", "$value.restaurantName", " "]
                        },
                    }, orders: {
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
            { $skip: pageQuery.skip }, { $limit: pageQuery.take }]).exec();

        console.log("listRestaurantRating", listRestaurantRating);

        if (listRestaurantRating && listRestaurantRating.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_RATING_LIST_SUCCESS"), 'data': listRestaurantRating });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_RATING_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("errrrrrrrrrrr", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

/** 
 * Get RestaurantRatingOne
 * url : /api/admin/restaurantRating/getRestaurantRatingOne
 * method : GET
 * author : Sathyamoorthi.R 
 * params : id of RestaurantRating _id
*/
exports.getRestaurantRatingOne = async (req, res) => {
    try {
        if (req.params.id) {
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }

        let getRestaurantRatingOne = await RestaurantRatingModel.find(condition)
            .select('_id rating comments userId restaurantId ')
            .populate('userId', 'firstName lastName')
            .populate('restaurantId', 'restaurantName')
            .populate('orderId', 'orderCode')
            .exec();

        var fullname = _.map(getRestaurantRatingOne, function (o) {
            console.log(o);
            return {
                userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                _id: o._id,
                rating: o.rating,
                comments: o.comments,
                restaurantName: o.restaurantId.restaurantName ? o.restaurantId.restaurantName : " ",
                orderCode: o.orderId.orderCode ? o.orderId.orderCode : " "
            }

        })

        if (getRestaurantRatingOne && getRestaurantRatingOne.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_RATING_LIST_SUCCESS"), 'data': fullname });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_RATING_NOT_FOUND") });
    } catch (err) {
        console.log("errrrrrrrrrrr", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/** 
 * Delete RestaurantRating
 * url : /api/admin/restaurantRating/delete
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of RestaurantRating _id
*/
exports.delete = async (req, res) => {
    console.log("rrrrrrrr", req.params.id);

    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        console.log("cccccc", condition)
        let deleteRestaurantRating = await RestaurantRatingModel.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });
        console.log("deleteRestaurantRating", deleteRestaurantRating);

        if (deleteRestaurantRating) {

            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_RATING_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_RATING_NOT_FOUND") });

        }


    } catch (err) {
        console.log(err);

        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.listItemRating = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        // { $match: { "status": _C.status.adminPanel.active } },
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        // if (req.params.id) {
        //     condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        // }

        let listItemRating = await ItemRatingModel.aggregate([
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
            }, {
                $unwind: {
                    path: "$value",
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $lookup: {
                    from: 'restaurantFoodItem',
                    localField: 'foodId',
                    foreignField: 'itemDetails.foodId',
                    as: 'item'
                }
            }, {
                $unwind: {
                    path: '$item',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $unwind: {
                    path: '$item.itemDetails',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $match: {
                    'item.itemDetails.foodId': objectId(req.params.foodId)
                }
            }, { $match: { "status": _C.status.adminPanel.active } }, {
                $project: {
                    user: {
                        id: '$data._id',
                        username: {
                            $concat: ["$data.firstName", " ", "$data.lastName"]
                        }
                    },
                    restaurant: {
                        id: "$value._id",
                        restaurantName: "$value.restaurantName",
                    },
                    food: {
                        id: "$item.itemDetails.foodId",
                        name: "$item.itemDetails.name",
                    },
                    rating: 1,
                    comments: 1
                }
            },
            { $match: likeQuery },
            { $skip: pageQuery.skip }, { $limit: pageQuery.take },


        ]).exec();
        console.log(listItemRating)
        if (listItemRating && listItemRating.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ITEM_RATING_LIST_SUCCESS"), 'data': listItemRating });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ITEM_RATING_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("errrrrrrrrrrr", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await RestaurantRatingModel.findOneAndUpdate({ '_id': req.params.RestaurantRatingId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_RATING_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_RATING_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


