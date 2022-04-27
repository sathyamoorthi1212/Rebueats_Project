const UserRoute = require('express').Router();
const OrderModel = require('../../models/Orders');
const Config = require('config');
const _C = require('../../config/constants');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const HelperFunc = require('./Function');
const _ = require('lodash');
var moment = require('moment');

exports.listOrder = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true, Condition = {};
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.admin.active;
            condition['orderStatus.code'] = _C.status.order.pending;
            let getOrderCount = await OrderModel.find(condition).count();
            res.header('x-total-count', getOrderCount);
        }
        console.log("c", condition);
        let getOrderList = await OrderModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile addressemail mobile address')
            .exec();
        console.log(getOrderList);
        var getvalue = _.map(getOrderList, function (o) {
            console.log(o);
            return {
                userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                userEmail: o.userId.email,
                usermobile: o.userId.mobile,
                useraddress: o.userId.address ? o.userId.address : " ",
                paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                _id: o._id,
                orderCode: o.orderCode,
                total: o.total,
                items: o.items,
                paymentType: (o.paymentType == 1) ? "cash" : "online",
                orderStatus: (o.orderStatus.code == 1) ? "pending" : "",
                orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                restaurantName: o.restaurantId.restaurantName,
                restaurant_mobile: o.restaurantId.mobile,
                restaurant_email: o.restaurantId.email,
                restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
            }
        })
        if (getOrderList && getOrderList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PENDING_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PENDING_ORDER_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }

}

exports.listAcceptedOrder = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true, Condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        console.log("AAAAAAAAAAAA", pagination);
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.admin.active
            condition['orderStatus.code'] = _C.status.order.accepted;
            condition['orderStatus.acceptedAt'] = { $exists: true };
            let getOrderCount = await OrderModel.find(condition).count();
            res.header('x-total-count', getOrderCount);
            console.log("getOrderCount", getOrderCount);
        } console.log(condition);

        let getOrderList = await OrderModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile address')
            .exec();
        console.log("getOrderList", getOrderList);
        var getvalue = _.map(getOrderList, function (o) {
            console.log("ooooooooooooo", o);
            return {
                userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                userEmail: o.userId.email,
                usermobile: o.userId.mobile,
                useraddress: o.userId.address ? o.userId.address : " ",
                _id: o._id,
                orderCode: o.orderCode,
                total: o.total,
                items: o.items,
                paymentType: (o.paymentType == 1) ? "cash" : "online",
                paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                orderStatus: (o.orderStatus.code == 3) ? "accepted" : "",
                orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                restaurantName: o.restaurantId.restaurantName,
                restaurant_mobile: o.restaurantId.mobile,
                restaurant_email: o.restaurantId.email,
                restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
            }
        })

        if (getOrderList && getOrderList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ACCEPTED_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ACCEPTED_ORDER_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}



exports.getOrder = async (req, res) => {
    try {
        if (req.params.id) {
            condition = { '_id': req.params.id, 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.pending };
        }
        let getOrder = await OrderModel.find(condition).limit(1)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName  email mobile address')
            .populate('restaurantId', 'restaurantName  email mobile address')
            .exec();

        console.log("code", getOrder);

        if (getOrder && getOrder.length > 0) {
            var getvalue = _.map(getOrder, function (o) {
                console.log("ooooooooooooo", o);
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : " ",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 1) ? "pending" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PENDING_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PENDING_ORDER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


exports.getAccepted = async (req, res) => {
    try {
        if (req.params.id) {
            condition = { '_id': req.params.id, 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.accepted };
            condition['orderStatus.acceptedAt'] = { $exists: true };
        }
        let getAccepted = await OrderModel.find(condition).limit(1)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile address')
            .exec();

        console.log("code", getAccepted);

        if (getAccepted && getAccepted.length > 0) {
            var getvalue = _.map(getAccepted, function (o) {
                console.log("ooooooooooooo", o);
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : "",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 3) ? "accepted" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "

                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ACCEPTED_LIST_SUCCESS"), 'data': getvalue[0] });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ACCEPTED_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


exports.acceptedGenerateCSV = async (req, res) => {
    try {
        condition = { 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.accepted };
        condition['orderStatus.acceptedAt'] = { $exists: true };
        let getAccepted = await OrderModel.find(condition)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile address')
            .exec();
        if (getAccepted && getAccepted.length > 0) {
            var getvalue = _.map(getAccepted, function (o) {
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : "",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 3) ? "accepted" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ACCEPTED_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ACCEPTED_ORDER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


exports.pendingGenerateCSV = async (req, res) => {
    try {
        condition = { 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.pending };
        let getOrder = await OrderModel.find(condition)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName  email mobile address')
            .populate('restaurantId', 'restaurantName  email mobile address')
            .exec();
        if (getOrder && getOrder.length > 0) {
            var getvalue = _.map(getOrder, function (o) {
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : " ",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 1) ? "pending" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("PENDING_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("PENDING_ORDER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

exports.listDeliveryOrder = async (req, res) => {
    try {
        if (typeof req.query._sort === "undefined" || req.query._sort === "") {
            req.query._sort = "updatedAt";
        }

        if (typeof req.query._order === "undefined" || req.query._order === "") {
            req.query._order = "DESC";
        }
        var pagination = true, Condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        console.log("AAAAAAAAAAAA", pagination);
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.admin.active
            condition['orderStatus.code'] = _C.status.order.delivery;
            condition['orderStatus.deliveredAt'] = { $exists: true };
            let getOrderCount = await OrderModel.find(condition).count();
            res.header('x-total-count', getOrderCount);
            console.log("getOrderCount", getOrderCount);
        } console.log(condition);

        let getDeliveryList = await OrderModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile address')
            .exec();
        console.log("getDeliveryList", getDeliveryList);
        var getvalue = _.map(getDeliveryList, function (o) {
            console.log("ooooooooooooo", o);
            return {
                userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                userEmail: o.userId.email,
                usermobile: o.userId.mobile,
                useraddress: o.userId.address ? o.userId.address : " ",
                _id: o._id,
                orderCode: o.orderCode,
                total: o.total,
                items: o.items,
                paymentType: (o.paymentType == 1) ? "cash" : "online",
                paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                orderStatus: (o.orderStatus.code == 7) ? "Delivered" : "",
                orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                restaurantName: o.restaurantId.restaurantName,
                restaurant_mobile: o.restaurantId.mobile,
                restaurant_email: o.restaurantId.email,
                restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
            }
        })

        if (getDeliveryList && getDeliveryList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DELIVERY_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DELIVERY_ORDER_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

exports.getDelivery = async (req, res) => {
    try {
        if (req.params.id) {
            condition = { '_id': req.params.id, 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.delivery };
            condition['orderStatus.deliveredAt'] = { $exists: true };
        }
        let getDelivery = await OrderModel.find(condition).limit(1)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName email mobile address')
            .populate('restaurantId', 'restaurantName email mobile address')
            .exec();

        console.log("code", getDelivery);

        if (getDelivery && getDelivery.length > 0) {
            var getvalue = _.map(getDelivery, function (o) {
                console.log("ooooooooooooo", o);
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : "",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 7) ? "Delivered" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "

                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DELIVERY_ORDER_LIST_SUCCESS"), 'data': getvalue[0] });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DELIVERY_ORDER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

exports.deliveryGenerateCSV = async (req, res) => {
    try {
        condition = { 'status': _C.status.admin.active, 'orderStatus.code': _C.status.order.delivery }; condition['orderStatus.deliveredAt'] = { $exists: true };
        let getOrder = await OrderModel.find(condition)
            .select('_id orderCode total paymentType orderDate orderStatus items.itemName items.totalPrice items.quantity items.price paymentReceived')
            .populate('userId', 'firstName lastName  email mobile address')
            .populate('restaurantId', 'restaurantName  email mobile address')
            .exec();
        if (getOrder && getOrder.length > 0) {
            var getvalue = _.map(getOrder, function (o) {
                return {
                    userName: (o.userId.firstName) + (o.userId.lastName) ? (o.userId.firstName) + (o.userId.lastName) : " ",
                    userEmail: o.userId.email,
                    usermobile: o.userId.mobile,
                    useraddress: o.userId.address ? o.userId.address : " ",
                    _id: o._id,
                    orderCode: o.orderCode,
                    total: o.total,
                    paymentType: (o.paymentType == 1) ? "cash" : "online",
                    paymentReceived: (o.paymentReceived == 1) ? "received" : "Not received",
                    orderStatus: (o.orderStatus.code == 7) ? "Delivered" : "",
                    orderDate: moment(o.orderDate).format("MMMM Do YYYY, h:mm:ss a"),
                    items: o.items,
                    restaurantName: o.restaurantId.restaurantName,
                    restaurant_mobile: o.restaurantId.mobile,
                    restaurant_email: o.restaurantId.email,
                    restaurant_address: o.restaurantId.address ? o.restaurantId.address : " "
                }
            })
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("DELIVERY_ORDER_LIST_SUCCESS"), 'data': getvalue });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("DELIVERY_ORDER_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


