//model
const UserCartModel = require('../../models/UserCart');
const OrderModel = require('../../models/Orders');
const _                        = require('lodash');
const logger = require('../../services/logger');
const firebase = require('firebase');
const axios = require('axios');

//function
const _C = require('../../config/constants');

//npm package
const HttpStatus = require('http-status-codes');
const zeropad = require('zeropad');
const Jwt = require('jsonwebtoken');
const Config = require('config');
const objectId = require('mongoose').Types.ObjectId;


/** 
 * create new order
 * url : 
 * method : POST
 * author : Sathyamoorthi.R 
 * body : cartId, dropLatlng(lat,lng), dropAddress, paymentDetail(paypal), dropDetailAddress, paymentMethod(cod,paypal,paytm), deliveryType, deliveryNotes
*/
exports.newOrder = async (req,res) => {
    try{
       // req.body.dropLatlng = JSON.parse(req.body.dropLatlng)
        let checkCart = await UserCartModel.findOne({"_id":req.body.cartId})
        if(!checkCart){
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':req.i18n.__("CART_EXPIRY")});
        }
        
        var cartCalculationDetail = await axios.get(`${(Config.server).uri}/api/order/getCart/${req.body.cartId}`);
console.log("cartCalculationDetail.tax11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",cartCalculationDetail)
        let orderCode = await newOrderCode();
        let authorization = req.headers.authorization;
        let token = authorization.split(' ');
        let decoded = Jwt.verify(token[1], Config.API_SECRET);
        let userId = decoded._id;
        var newDoc = new OrderModel({
            orderCode    : orderCode,
            userId       : userId,
            restaurantId : checkCart.restaurantId,
            tax          : cartCalculationDetail.tax,
            deliveryFee  : cartCalculationDetail.deliveryFee,

            "subTotal"    : cartCalculationDetail.subTotal,
            "tax"         : cartCalculationDetail.tax,
            "deliveryFee" : cartCalculationDetail.deliveryFee,
            "total"       : cartCalculationDetail.total,
            "promotion"   : cartCalculationDetail.promotion,

            items        : checkCart.items,
            dropLocation : {
                coordinates : [parseFloat(req.body.dropLatlng.lng), parseFloat(req.body.dropLatlng.lat)]
            },
            dropAddress       : req.body.dropAddress,
            dropStreet        : req.body.dropStreet,
            dropDetailAddress : req.body.dropDetailAddress,
            paymentMethod     : _C.status.payment[req.body.paymentMethod],
            deliveryType      : _C.status.deliveryType[req.body.deliveryType],
            deliveryNotes     : (typeof req.body.deliveryNotes == "undefined" || req.body.deliveryNotes == "") ? "" : req.body.deliveryNotes,
        })
        newDoc.paymentType = (_C.status.payment[req.body.paymentMethod] == 1)?_C.status.paymentType.offline:_C.status.paymentType.online;
        if(_C.status.payment[req.body.paymentMethod] != 1){
            newDoc.paymentDetail = req.body.paymentDetail
        }
        let updateData = await newDoc.save();
        addOrderToFb(updateData);
        return res.status(HttpStatus.OK).json({'success':true, 'message':req.i18n.__("ORDER_PLACED_SUCCESSFULLY"),"data":updateData})
    }
    catch(err){
        console.log("err",err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});
    }
}

async function newOrderCode(){
    let orderData = await OrderModel.findOne({}).sort({"_id":-1});
    if(orderData){
        let splitCode = orderData.orderCode.split('-')
        let oldOrderNo = parseFloat(splitCode[1]) + 1;        
        let newOrderNo = splitCode[0]+'-'+zeropad(oldOrderNo,6);        
        return newOrderNo
    }
    return 'Rebueats-000001'
}
/** 
 * Add To user details in firebase 
*/
function addOrderToFb(datas) {
    console.log("datas",datas.userId)

      if (!firebase.apps.length) {
        firebase.initializeApp(Config.firebasekey);
      }

      var db = firebase.database();
      var ref = db.ref("orders"); 
      var requestData = {     
        userId          : (datas.userId).toString(),
        restaurantId    : (datas.restaurantId).toString(),
        driverId        : datas.driverId ?(datas.driverId).toString():"",
        orderStatus     : datas.orderStatus.code,
        orderCode       : datas.orderCode,
        dropLocation    : datas.dropLocation,
        pickupLocation  : datas.pickupLocation?datas.pickupLocation:""
      };
      var id = datas._id.toString(); 
      var usersRef = ref.child(id); 

      usersRef.set(requestData,function(snapshot) {   
        logger.info(requestData)
      });  
}

/**  
 * get order data
 * URL : 
 * Method : GET
 * Params : _id
*/
exports.getOrder = async (req,res) => {
    var orderList = [];
    try{
        let orderData = await OrderModel.aggregate([
            {"$match":{"_id":objectId(req.params.id), "status":_C.status.active}},
            {"$lookup":{
                "from"         : "restaurant",
                "localField"   : "restaurantId",
                "foreignField" : "_id",
                "as"           : "restaurantInfo"
            }},
            {"$unwind" : "$restaurantInfo"},
            {"$lookup":{
                "from"         : "user",
                "localField"   : "userId",
                "foreignField" : "_id",
                "as"           : "userInfo"
            }},
            {"$unwind" : "$userInfo"},
            {"$project":{
                "restaurantImage"  : { "$concat": [Config.server.uri + _C.path.restaurantImagePath, "", "$restaurantInfo.restaurantImage"] },
                "restaurantName"   : "$restaurantInfo.restaurantName",
                "userLatLng":{
                    "lat": { "$arrayElemAt": [ "$dropLocation.coordinates", 1 ] },
                    "lng": { "$arrayElemAt": [ "$dropLocation.coordinates", 0 ] }
                },                
                "restaurantLatLng" : {
                    "lat": {"$arrayElemAt": [ "$restaurantInfo.restaurantLocation.coordinates", 1 ] },
                    "lng": {"$arrayElemAt": [ "$restaurantInfo.restaurantLocation.coordinates", 0 ] }
                },
                "dropAddress"      : 1,
                "orderStatus"      : 1,
                "userName"         : "$userInfo.firstName",
                "userProfileImage" : { "$ifNull": [{ "$concat": [Config.server.uri + _C.path.userImagePath, "", "$userInfo.profileImage"] }, `http://${Config.server.host}:${Config.server.port}/user/default.png`] },
            }}
        ])
        if(orderData && orderData.length >0){
             
                    orderList= _.map(orderData, function(o) {
                        var orderStatus=o.orderStatus.code;
                        console.log(orderStatus)
                                   return {
                                     '_id'              : o._id,
                                     'dropAddress'      : o.dropAddress?o.dropAddress:"",
                                     'restaurantImage'  : o.restaurantImage, 
                                     'restaurantName'   : o.restaurantName?o.restaurantName:"",                
                                     'userLatLng'       : o.userLatLng,  
                                     'restaurantLatLng' : o.restaurantLatLng,
                                     'userName'         : o.userName?o.userName:"",
                                     'userProfileImage' : (o.profileImage) ? o.profileImage : `http://${Config.server.host}:${Config.server.port}/user/default.png`,
                                     'orderStatus'      : (orderStatus ===1) ? ('pending'):(orderStatus ===2)? ('confirmed'):(orderStatus ===3)?('accept/reject'):(orderStatus ===4)?('pickup'):(orderStatus ===5)?"onthe way":(orderStatus ===6)?"arrived":"delivery"                                     
                                    }                
                    })                            
            return res.status(HttpStatus.OK).json({"success":true, 'message':req.i18n.__("ORDER_DATA_SUCCESS"),'data':orderList[0] })
            
        }

        return res.status(HttpStatus.NOT_FOUND).json({'success':true, 'message':req.i18n.__("NO_ORDER_FOUND"),"data":[]})
    }
    catch(err){
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":{}});
    }
}

exports.upcomingOrderList = async (req,res) => {
    try{
        let authorization = req.headers.authorization;
       let token = authorization.split(' ');
       let decoded = Jwt.verify(token[1], Config.API_SECRET);
       let userId = decoded._id;
        let orderList = await OrderModel.aggregate([
            {"$match":{"userId":objectId(userId),"orderStatus.code":{"$nin":[_C.status.order.delivery]}}},
            {"$lookup":{
                "from"         : "restaurant",
                "localField"   : "restaurantId",
                "foreignField" : "_id",
                "as"           : "restaurantInfo"
            }},
            {"$unwind" : "$restaurantInfo"},
            {"$project":{
                "restaurantImage"  : { "$concat": [Config.server.uri + _C.path.restaurantImagePath, "", "$restaurantInfo.restaurantImage"] },
                "restaurantName"   : "$restaurantInfo.restaurantName",
                "orderStatus": {
                    '$switch' : {
                      'branches' : [
                        //{ 'case': { '$eq' : ["$orderStatus.code", 1]}, 'then':"pending"},
                        { 'case': { '$eq' : ["$orderStatus.code", 2]}, 'then':"confirmed"},
                        { 'case': { '$eq' : ["$orderStatus.code", 3]}, 'then':"accept/reject"},
                        { 'case': { '$eq' : ["$orderStatus.code", 4]}, 'then':"pickup"},
                        { 'case': { '$eq' : ["$orderStatus.code", 5]}, 'then':"onthe way"},
                        { 'case': { '$eq' : ["$orderStatus.code", 6]}, 'then':"arrived"},
                        //{ 'case': { '$eq' : ["$orderStatus.code", 7]}, 'then':"delivery"}
                      ],
                    }
                },
                "totalPrice": "$total",
                "items": {
                    "$map" : {
                        input: "$items",
                        as: "val",
                        in: {"_id":"$$val._id","itemName":"$$val.itemName" }
                    }
                },
                "orderDate"    : 1,
                "restaurantId" : 1
            }}
        ])
        return res.status(HttpStatus.OK).json({'success':true, 'message':req.i18n.__("UPCOMING_ORDER_LIST"), 'data':orderList})
    }
    catch(err){
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});
    }
}

exports.pastOrderList = async (req,res) => {
    try{
        let authorization = req.headers.authorization;
        let token = authorization.split(' ');
        let decoded = Jwt.verify(token[1], Config.API_SECRET);
        let userId = decoded._id;

        let orderList = await OrderModel.aggregate([
            {"$match":{"userId":objectId(userId),"orderStatus.code":{"$in":[_C.status.order.delivery]}}},
            {"$lookup":{
                "from"         : "restaurant",
                "localField"   : "restaurantId",
                "foreignField" : "_id",
                "as"           : "restaurantInfo"
            }},
            {"$unwind" : "$restaurantInfo"},
            {"$project":{
                "restaurantImage"  : { "$concat": [Config.server.uri + _C.path.restaurantImagePath, "", "$restaurantInfo.restaurantImage"] },
                "restaurantName"   : "$restaurantInfo.restaurantName",
                "orderStatus": {
                    '$switch' : {
                      'branches' : [
                        //{ 'case': { '$eq' : ["$orderStatus.code", 1]}, 'then':"pending"},
                        // { 'case': { '$eq' : ["$orderStatus.code", 2]}, 'then':"confirmed"},
                        // { 'case': { '$eq' : ["$orderStatus.code", 3]}, 'then':"accept/reject"},
                        // { 'case': { '$eq' : ["$orderStatus.code", 4]}, 'then':"pickup"},
                        // { 'case': { '$eq' : ["$orderStatus.code", 5]}, 'then':"onthe way"},
                        // { 'case': { '$eq' : ["$orderStatus.code", 6]}, 'then':"arrived"},
                        { 'case': { '$eq' : ["$orderStatus.code", 7]}, 'then':"delivery"}
                      ],
                    }
                },
                "totalPrice": "$total",
                "items": {
                    "$map" : {
                        input: "$items",
                        as: "val",
                        in: {"_id":"$$val._id","itemName":"$$val.itemName" }
                    }
                },
                "orderDate"    : 1,
                "restaurantId" : 1
            }}
        ])
        return res.status(HttpStatus.OK).json({'success':true, 'message':req.i18n.__("UPCOMING_ORDER_LIST"), 'data':orderList})
    }
    catch(err){
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});
    }
}

exports.getReceipt = async (req,res) => {
    try{
        let orderList = await OrderModel.aggregate([
            {"$match" : {"_id":objectId(req.params.id)}},
            {"$lookup":{
                "from"         : "restaurant",
                "localField"   : "restaurantId",
                "foreignField" : "_id",
                "as"           : "restaurantInfo"
            }},
            {"$unwind" : "$restaurantInfo"},
            {"$project":{
                "restaurantName" : "$restaurantInfo.restaurantName",  
                "orderCode"      : 1,  
                "orderDate"      : 1,            
                "items": {
                    "$map" : {
                        input : "$items",
                        as    : "val",
                        in    : {"_id":"$$val._id","itemName":"$$val.itemName","price":"$$val.price" }
                    }
                },
                "totalPrice"  : "$total",
                "subTotal"    : 1,
                "promotion"   : 1,  
                "deliveryFee" : 1   
            }},
        ])
        return res.status(HttpStatus.OK).json({'success':false, 'message':req.i18n.__("UPCOMING_ORDER_LIST"), 'data':orderList})
    }
    catch(err){
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});
    }
}