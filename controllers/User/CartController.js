const UserRoute = require('express').Router();
const OrderModel = require('../../models/Orders');
const Config=require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C       = require('../../config/constants');
const PromoCodeModel = require('../../models/PromoCode');
const Helper = require('../../services/helper');
const UserModel = require('../../models/User');
const randomize = require('randomatic');
const RestaurantModel = require('../../models/Restaurant');
const FoodItemModel = require('../../models/RestaurantMenu');
const UserCartModel = require('../../models/UserCart');
const _ = require('lodash');
const objectId = require('mongoose').Types.ObjectId;
const moment   = require('moment');


/** 
 * Add rating
 * url : /api/restaurant/addCart
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.getMenu  = async (req, res) => {

  try{  
        let getFood=await FoodItemModel.aggregate([
          {
            '$unwind': {
              'path': '$itemDetails', 
              'preserveNullAndEmptyArrays': true
            }
          }, {
            '$unwind': {
              'path': '$itemDetails.tag', 
              'preserveNullAndEmptyArrays': true
            }
          },          
          {
           '$project': {
              "_id"              :1,
              "foodId"           :'$itemDetails.foodId',
              "name"             :"$itemDetails.name",
              "restaurantId"     :1,
              "description"      :'$itemDetails.description',
              "isPackage"        :'$itemDetails.isPackage',
              "additionalCharges":"$itemDetails.packagingCharges",
              "addOns"           :"$itemDetails.addOns",
              "tagName"          :"$itemDetails.tag.tagName",
              "tagId"            :"$itemDetails.tag.tagId",
              "size"             :"$itemDetails.size",
              "multiSize"        :"$itemDetails.multiSize",
              "availableStatus"  :'$itemDetails.availableStatus',
              "price"            :'$itemDetails.price',
              "availableStatus"  :'$itemDetails.availableStatus',
              "itemImage"        :"$itemDetails.itemImage",
              "availableFrom"    :"$itemDetails.availableFrom",
              "availableTo"      :"$itemDetails.availableTo"
          }
        },
        {"$match" : {'foodId' : objectId(req.params.foodId),
                     'tagId'  : objectId(req.params.tagId)
                    },
        }
        ]);
        var updateData=getFood[0];
        var now = new Date();
        var weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        var day = weekday[now.getDay()];
        var seconds=(now.getMinutes()+(60*now.getHours()));
console.log("getMinutes",seconds);
        var getTiming = await RestaurantModel.findOne({'_id':updateData.restaurantId}).populate('restaurantTimingId', 'hours -_id').select('restaurantTimingId deliveryCharge itemTaxAmount restaurantName').lean().exec();  
        var weekDay = (day == 'monday') ? getTiming.restaurantTimingId.hours.monday : (day == 'tuesday') ? getTiming.restaurantTimingId.hours.tuesday : (day == 'wednesday') ? getTiming.restaurantTimingId.hours.wednesday : (day == 'thursday') ? getTiming.restaurantTimingId.hours.thursday : (day == 'friday') ? getTiming.restaurantTimingId.hours.friday : (day == 'saturday') ? getTiming.restaurantTimingId.hours.saturday : getTiming.restaurantTimingId.hours.sunday;
        var result = weekDay.filter((x) => { return ((x.opening <= seconds) && (x.closing >= seconds)); });
          if(result.length==0){

              throw { "errmsg": req.i18n.__('RESTAURTANT_CLOSED')  };
          }

          if(((updateData.availableFrom <= seconds) && (updateData.availableTo >= seconds))){
                 var checkCart     = await UserCartModel.findOne({'uuid':req.headers['uuid']}).exec(); 
console.log("checkCart",checkCart)                ;
                 var getSize       = updateData.size;
                 var getMultiSize  = updateData.multiSize;
                 var postData      = req.body.multiSize;
                 var getSizeAmount = _.filter(getSize, ['sizeId',objectId(req.body.sizeId)]); 
                 if(postData){
                     var multiSizePrice = _.filter(getMultiSize, function(val){
                           if(postData.includes(val.sizeId)){
                                  return (val.price);                              
                              }
                          })
                 }
            if(req.headers['uuid']){
                if(getFood && getFood.length >0){                              
                                      
                    if(!checkCart){
                        var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                        var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                        var additionalCharges = ((req.body.quantity)*(updateData.additionalCharges?(updateData.additionalCharges).toFixed(2):0));
                        var price             = ((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                        var totalPrice        = (additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);                
                        var updateCart1       = await UserCartModel.findOneAndUpdate(
                          { 
                            'uuid'      : req.headers['uuid'],                    
                            /*'cartKey'   : _C.cartKey*/
                            'restaurantId':updateData.restaurantId
                          },  
                          {
                              'uuid'      : req.headers['uuid'],
                              'status'  : _C.status.active,
                              'restaurantId':updateData.restaurantId,
                              //'cartKey' : _C.cartKey,
                              $push: { 'items': 
                                           { 'foodId'    : req.params.foodId,
                                             'itemName'  : updateData.name, 
                                             'price'     : price,
                                             'packagingCharges':updateData.additionalCharges,
                                             'additionalCharges':additionalCharges,
                                             'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                             'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                             'multiSize' : multiSizePrice,
                                             'totalPrice': totalPrice,
                                             'quantity'  : req.body.quantity,
                                             'itemImage' : updateData.itemImage,
                                             'status'    : 1
                                           }
                              }            
                          },
                          {upsert:true,new:true,setDefaultsOnInsert: true, runValidators: true}).exec();

                        var responseData = { getRecords: [], subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };
                        var getItems = await UserCartModel.find({'uuid':req.headers['uuid']}).select('restaurantId items._id uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                        var getCountFilter        = getItems[0].items;
                        var getCount              = getCountFilter.reverse();    
                        var cartId                = getItems[0]._id;
                        var restaurantId          = getItems[0].restaurantId;
                        var subTotal              = _.sumBy(getCount, 'totalPrice');
                        var items                 = _.sumBy(getCount, 'quantity');  
                        var tax                   = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                        var deliveryFee           = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                        var total                 = (subTotal+tax+deliveryFee); 
                         responseData.cartId      = cartId,                                              
                         responseData.restaurantId= restaurantId;                         
                         responseData.restaurantName= getTiming.restaurantName; 
                         responseData.promotion   = 0;     
                         responseData.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));                                               
                         responseData.subTotal    = subTotal.toFixed(2);
                         responseData.items       = items;
                         responseData.tax         = tax.toFixed(2);
                         responseData.deliveryFee = deliveryFee;
                         responseData.total       = total.toFixed(2);                        
                         responseData.getRecords  = _.map(getCount, function(o) {
                               return {                         
                                 '_id'              : o._id,
                                 'totalPrice'       : o.totalPrice,
                                 'itemName'         : o.itemName, 
                                 'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                 'quantity'         : o.quantity,  
                                 'uuid'             : req.headers['uuid'],
                                 'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                }                
                            })

                        return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("RESTAURTANT_DATA_SUCCESS"),'data':responseData}); 
                    }else if(checkCart &&(req.headers['uuid'] == checkCart.uuid) &&( JSON.stringify(checkCart.restaurantId)==JSON.stringify(updateData.restaurantId))){
console.log("sssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssammmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")
                          var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                          var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                          var additionalCharges = ((req.body.quantity)*(updateData.additionalCharges?((updateData.additionalCharges).toFixed(2)):0));
                          var price             = ((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                          var totalPrice        = (additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);
                          var updateCart        = await UserCartModel.findOneAndUpdate(
                            { restaurantId : updateData.restaurantId,
                              uuid         : req.headers['uuid'],
                              //cartKey      : _C.cartKey
                            },  
                            {
                                'uuid'  : req.headers['uuid'],                      
                                'restaurantId':updateData.restaurantId,
                                'cartKey' : _C.cartKey,
                                $push: { 'items': 
                                             { 'foodId'    : req.params.foodId,
                                               'itemName'  : updateData.name, 
                                               'price'     : updateData.price,
                                               'packagingCharges':updateData.additionalCharges,
                                               'totalPrice': totalPrice,
                                               'quantity'  : req.body.quantity,
                                               'additionalCharges':additionalCharges,
                                               'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                               'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                               'multiSize' : multiSizePrice,
                                               'itemImage' : updateData.itemImage,
                                               'status'    : 1
                                             }
                                }            
                            },
                            {upsert:true,new:true}).exec();
                          var responseData = { getRecords: [], subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };
                          var getItems = await UserCartModel.find({'uuid':req.headers['uuid'] /*'cartKey':_C.cartKey*/}).select('restaurantId items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();                          
                          var cartId                = getItems[0]._id;
                          var restaurantId          = getItems[0].restaurantId;
                          var getCount1             = getItems[0].items;
                          var getCountFilter        = _.filter(getCount1, ['status', 1]);
                          var getCount              = getCountFilter.reverse();
                          var subTotal              = _.sumBy(getCount, 'totalPrice');
                          var items                 = _.sumBy(getCount, 'quantity'); 
                          var tax                   = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                          var deliveryFee           = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                          var total                 = (subTotal+tax+deliveryFee);                                             
                           responseData.cartId      = cartId,                                              
                           responseData.restaurantId= restaurantId;                         
                           responseData.restaurantName= getTiming.restaurantName;
                           responseData.promotion   = 0;  
                           responseData.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));                                                  
                           responseData.subTotal    = subTotal.toFixed(2);
                           responseData.items       = items;
                           responseData.tax         = tax.toFixed(2);
                           responseData.deliveryFee = deliveryFee;
                           responseData.total       = total.toFixed(2);                        
                           responseData.getRecords  = _.map(getCount, function(o) {
                                 return {
                                   //cartId           : cartId,
                                   /*restaurantId     : restaurantId,*/
                                   '_id'              : o._id,
                                   'totalPrice'       : o.totalPrice,
                                   'itemName'         : o.itemName, 
                                   'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                   'quantity'         : o.quantity,  
                                   'uuid'             : req.headers['uuid'],
                                   'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                  }                
                              })

                          if(updateCart){
                              return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__(" RESTAURTANT_DATA_SUCCESS"),'data':responseData}); 
                          }else{

                            return res.status(HttpStatus.OK).json({ 'success': false, 'message':req.i18n.__("RESTAURTANT_DATA_SUCCESS")}); 
                          }

                    }else{
console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDdddddddddddddddddddddddddddddiiiiiiiiiiiiiiiiiiiifffffffffffffffffffffffffffffffffffffffffffff",updateData.restaurantId)                ;
console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDdddddddddddddddddddddddddddddiiiiiiiiiiiiiiiiiiiifffffffffffffffffffffffffffffffffffffffffffff",req.body.quantity)                ;
                        var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                        var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                        var additionalCharges = ((req.body.quantity)*(updateData.additionalCharges?(updateData.additionalCharges).toFixed(2):0));
                        var price             = ((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                        var totalPrice        = (additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);
                        var checkCart         = await UserCartModel.findOne({'uuid':req.headers['uuid']});
                        var clearCart         = await UserCartModel.findOneAndRemove({'_id':checkCart._id});
                        var updateCart1       = await UserCartModel.findOneAndUpdate(
                          { 
                            'uuid'        : req.headers['uuid'],                    
                            'restaurantId': updateData.restaurantId,
                          },  
                          {
                              'uuid'      : req.headers['uuid'],
                              'status'  : _C.status.active,
                              'restaurantId':updateData.restaurantId,
                              $push: { 'items': 
                                           { 'foodId'    : req.params.foodId,
                                             'itemName'  : updateData.name, 
                                             'price'     : price,
                                             'packagingCharges':updateData.additionalCharges,
                                             'additionalCharges':additionalCharges,
                                             'totalPrice': totalPrice,
                                             'quantity'  : req.body.quantity,
                                             'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                             'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                             'multiSize' : multiSizePrice,
                                             'itemImage' : updateData.itemImage,
                                             'status'    : 1
                                           }
                              }            
                          },
                          {upsert:true,new:true,setDefaultsOnInsert: true, runValidators: true}).exec();
                            var responseData1 = { getRecords: [], subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };

                            let getItems = await UserCartModel.find({'uuid':req.headers['uuid']}).select('restaurantId items._id uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                            let getCountFilter          = getItems[0].items;
                            var getCount                = getCountFilter.reverse();
                            var cartId                  = getItems[0]._id;
                            var restaurantId            = getItems[0].restaurantId;
                            var subTotal                = _.sumBy(getCount, 'totalPrice');
                            var items                   = _.sumBy(getCount, 'quantity'); 
                            var tax                     = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                            var deliveryFee             = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                            var total                   = (subTotal+tax+deliveryFee);
                             responseData1.cartId       = cartId,                                                        
                             responseData1.restaurantId =restaurantId;
                             responseData1.restaurantName = getTiming.restaurantName;
                             responseData1.promotion   = 0;
                             responseData1.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));                                                                                 
                             responseData1.subTotal     = subTotal.toFixed(2);
                             responseData1.items        = items;
                             responseData1.tax          = tax.toFixed(2);
                             responseData1.deliveryFee  = deliveryFee;
                             responseData1.total        = total.toFixed(2);                        
                             responseData1.getRecords   = _.map(getCount, function(o) {
                                   return {
                                     //cartId           : cartId,                         
                                     '_id'              : o._id,
                                     'totalPrice'       : o.totalPrice,
                                     'itemName'         : o.itemName, 
                                     'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                     'quantity'         : o.quantity,  
                                     'uuid'             : req.headers['uuid'],
                                     'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                    }                
                                })                            
                            return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("clearCArt"),'data':responseData1}); 
                    }
                    
                }
            }else if(req.headers['authorization']){
              let authorization = req.headers.authorization;
              let token = authorization.split(' ');
              let decoded = Jwt.verify(token[1], Config.API_SECRET);
              let userId = decoded._id;
                if(getFood && getFood.length >0){              
                    var updateData=getFood[0];
                    var checkCart = await UserCartModel.findOne({'userId':userId}).exec();
                    if(!checkCart){
                          var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                          var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                          var additionalCharges =((req.body.quantity)*(updateData.additionalCharges?(updateData.additionalCharges).toFixed(2):0));
                          var price             =((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                          var totalPrice        =(additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);
                          
                          var updateCart1       = await UserCartModel.findOneAndUpdate(
                            { 
                              'userId'      : userId,                    
                              'restaurantId':updateData.restaurantId
                            },  
                            {
                                'userId'      : userId,
                                'status'  : _C.status.active,
                                'restaurantId':updateData.restaurantId,

                                $push: { 'items': 
                                             { 'foodId'    : req.params.foodId,
                                               'itemName'  : updateData.name, 
                                               'price'     : price,
                                               'packagingCharges':updateData.additionalCharges,
                                               'additionalCharges':additionalCharges,
                                               'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                               'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                               'multiSize' : multiSizePrice,
                                               'totalPrice': totalPrice,
                                               'quantity'  : req.body.quantity,
                                               'itemImage' : updateData.itemImage,
                                               'status'    : 1
                                             }
                                }            
                            },
                            {upsert:true,new:true,setDefaultsOnInsert: true, runValidators: true}).exec();
                          var responseData = { getRecords: [], subTotal: 0,items:0,Tax:0,deliveryFee:0,total:0};
                          var getItems = await UserCartModel.find({'userId':userId}).select('restaurantId items._id userId items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                          var getCountFilter         = getItems[0].items;
                          var getCount               = getCountFilter.reverse();
                          var cartId                 = getItems[0]._id;
                          var restaurantId           = getItems[0].restaurantId;
                          var subTotal               = _.sumBy(getCount, 'totalPrice');
                          var items                  = _.sumBy(getCount, 'quantity');        
                          var items                  = _.sumBy(getCount, 'quantity'); 
                          var tax                    = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                          var deliveryFee            = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                          var total                  = (subTotal+tax+deliveryFee);
                           responseData.cartId      = cartId,                                              
                           responseData.restaurantId= restaurantId;                         
                           responseData.restaurantName= getTiming.restaurantName;
                           responseData.promotion    = 0;
                           responseData.createdAt    = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));
                           responseData.subTotal     = subTotal.toFixed(2);
                           responseData.items        = items;
                           responseData.tax          = tax.toFixed(2);
                           responseData.deliveryFee  = deliveryFee;
                           responseData.total        = total.toFixed(2);                        
                           responseData.getRecords   = _.map(getCount, function(o) {
                                 return {                         
                                   '_id'              : o._id,
                                   'totalPrice'       : o.totalPrice,
                                   'itemName'         : o.itemName, 
                                   'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                   'quantity'         : o.quantity,  
                                   'userId'           : userId,
                                   'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                  }                
                              })


                          return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("RESTAURTANT_DATA_SUCCESS"),'data':responseData}); 
                    }else if(checkCart &&(userId == checkCart.userId) &&( JSON.stringify(checkCart.restaurantId)==JSON.stringify(updateData.restaurantId))){

                          var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                          var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                          var additionalCharges = ((req.body.quantity)*(updateData.additionalCharges?((updateData.additionalCharges).toFixed(2)):0));
                          var price             =((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                          var totalPrice        =(additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);
                          var updateCart        = await UserCartModel.findOneAndUpdate(
                            { restaurantId : updateData.restaurantId,
                              userId       : userId,
                            },  
                            {
                                'userId'      : userId,                      
                                'restaurantId': updateData.restaurantId,
                                $push: { 'items': 
                                             { 'foodId'    : req.params.foodId,
                                               'itemName'  : updateData.name, 
                                               'price'     : updateData.price,
                                               'packagingCharges':updateData.additionalCharges,
                                               'totalPrice': totalPrice,
                                               'quantity'  : req.body.quantity,
                                               'additionalCharges':additionalCharges,
                                               'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                               'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                               'multiSize' : multiSizePrice,
                                               'itemImage' : updateData.itemImage,
                                               'status'    : 1
                                             }
                                }            
                            },
                            {upsert:true,new:true}).exec();
                          var responseData = { getRecords: [], subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };

                          let getItems = await UserCartModel.find({'userId':userId /*'cartKey':_C.cartKey*/}).select('restaurantId items._id items.status userId items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                          let getCount1              = getItems[0].items;
                          var cartId                 = getItems[0]._id;
                          var restaurantId           = getItems[0].restaurantId;
                          var getCountFilter         = _.filter(getCount1, ['status', 1]);
                          var getCount               = getCountFilter.reverse();
                          let subTotal               = _.sumBy(getCount, 'totalPrice');
                          let items                  = _.sumBy(getCount, 'quantity');        
                          var tax                    = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                          var deliveryFee            = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                          var total                  = (subTotal+tax+deliveryFee);
                           responseData.cartId      = cartId,                                              
                           responseData.restaurantId= restaurantId;                         
                           responseData.restaurantName= getTiming.restaurantName;
                           responseData.promotion    = 0;
                           responseData.createdAt    = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));
                           responseData.subTotal     = subTotal.toFixed(2);
                           responseData.items        = items;
                           responseData.tax          = tax.toFixed(2);
                           responseData.deliveryFee  = deliveryFee;
                           responseData.total        = total.toFixed(2);                        
                           responseData.getRecords   = _.map(getCount, function(o) {
                                 return {
                                   //cartId           : cartId,
                                   /*restaurantId     : restaurantId,*/
                                   '_id'              : o._id,
                                   'totalPrice'       : o.totalPrice,
                                   'itemName'         : o.itemName, 
                                   'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                   'quantity'         : o.quantity,  
                                   'userId'           : userId,
                                   'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                  }                
                              })


                          if(updateCart){
                              return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__(" RESTAURTANT_DATA_SUCCESS"),'data':responseData}); 
                          }else{
                           // var clearCart=await UserCartModel.findOneAndRemove({'cartKey' :_C.cartKey});

                            return res.status(HttpStatus.OK).json({ 'success': false, 'message':req.i18n.__("RESTAURTANT_DATA_SUCCESS")}); 
                          }

                    }else{
                          var checkMultiSize    = _.sumBy(multiSizePrice, 'price');
                          var sizeAmount        = (getSizeAmount && getSizeAmount.length>0)?(getSizeAmount[0].price):0;
                          var additionalCharges = ((req.body.quantity)*(updateData.additionalCharges?(updateData.additionalCharges).toFixed(2):0));
                          var price             = ((req.body.quantity)*(updateData.price?(updateData.price).toFixed(2):0));
                          var totalPrice        = (additionalCharges+price+sizeAmount+checkMultiSize).toFixed(2);
                          var checkCart         = await UserCartModel.findOne({'userId': userId});
                          var clearCart         = await UserCartModel.findOneAndRemove({'_id':checkCart._id});                
                          var updateCart1       = await UserCartModel.findOneAndUpdate(
                            { 
                              'userId'      : userId,                    
                              'restaurantId': updateData.restaurantId
                            },  
                            {
                                'userId'  : userId,
                                'status'  : _C.status.active,
                                'restaurantId':updateData.restaurantId,

                                $push: { 'items': 
                                             { 'foodId'    : req.params.foodId,
                                               'itemName'  : updateData.name, 
                                               'price'     : price,
                                               'packagingCharges':updateData.additionalCharges,
                                               'additionalCharges':additionalCharges,
                                               'totalPrice': totalPrice,
                                               'quantity'  : req.body.quantity,
                                               'addtionalNote':(req.body.addtionalNote)?(req.body.addtionalNote):"",
                                               'sizeId'    : (req.body.sizeId) ?({'sizeId':req.body.sizeId,'sizeAmount':sizeAmount}):"",
                                               'multiSize' : multiSizePrice,
                                               'itemImage' : updateData.itemImage,
                                               'status'    : 1
                                             }
                                }            
                            },
                            {upsert:true,new:true,setDefaultsOnInsert: true, runValidators: true}).exec();
                              var responseData1 = { getRecords: [], subTotal: 0,items:0,tax:0,deliveryFee:0,total:0};

                              let getItems = await UserCartModel.find({'userId':userId}).select('restaurantId items._id userId items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                              var getCountFilter          = getItems[0].items;
                              var getCount                = getCountFilter.reverse();
                              var cartId                  = getItems[0]._id;
                              var restaurantId            = getItems[0].restaurantId;
                              var subTotal                = _.sumBy(getCount, 'totalPrice');
                              var items                   = _.sumBy(getCount, 'quantity');        
                              var tax                     = ((subTotal)*(getTiming.itemTaxAmount?getTiming.itemTaxAmount:0));   
                              var deliveryFee             = (getTiming.deliveryCharge)?(getTiming.deliveryCharge):0;
                              var total                   = (subTotal+tax+deliveryFee);
                               responseData1.cartId       = cartId,                                              
                               responseData1.restaurantId = restaurantId;
                               responseData1.restaurantName=getTiming.restaurantName;
                               responseData1.promotion    = 0;
                               responseData1.createdAt    = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));
                               responseData1.subTotal     = subTotal.toFixed(2);
                               responseData1.items        = items;
                               responseData1.tax          = tax.toFixed(2);
                               responseData1.deliveryFee  = deliveryFee;
                               responseData1.total        = total.toFixed(2);                        
                               responseData1.getRecords   = _.map(getCount, function(o) {
                                     return {
                                       //cartId           : cartId,                         
                                       '_id'              : o._id,
                                       'totalPrice'       : o.totalPrice,
                                       'itemName'         : o.itemName, 
                                       'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                                       'quantity'         : o.quantity,  
                                       'userId'           : userId,
                                       'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                                      }                
                                  })
                          //var clearCart=await UserCartModel.findOneAndRemove({'userId' :userId});
                          return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("clearCArt"),'data':responseData1}); 
                    }
                    
                }
            }
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':req.i18n.__("RESTAURTANT_NOT_FOUND"),'data':[]}); 
        
      }else{
      throw { "errmsg": req.i18n.__('ITEM_SOLD_OUT')  }
    }
                                  
  }catch (err) {
        console.log('cccccccccccccc',err);  
        if (err.code == 11000) {
              var clearCart=await UserCartModel.findOneAndRemove({'cartKey' :_C.cartKey});
                err.errmsg = {"cart":req.i18n.__("clearCart")};
            }          
          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});

  }
};

exports.removeItem = async function(req, res) {
  try{                 
        let condition = { /*'_id': req.params.cartId,*/'items._id': req.params.itemCartId, 'status': _C.status.active };
        let updateData = await UserCartModel.findOneAndUpdate(condition, {
            "$set": { "items.$.status": _C.status.deleted }
        },{new:true});
console.log("updateData1111111111111",updateData)
        if(updateData!=null){
          let getItems = await UserCartModel.find({'_id':updateData._id,'status':1}).select('restaurantId items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').lean().exec();
//          var getCountFilter      = _.filter(getCount1, ['status', 1]);
          //console.log("REMOVEALLLLLLLLLLLLLLLLLLLLLLLLLLLL",getItems);
          console.log("REMOVEALLLLLLLLLLLLLLLLLLLLLLLLLLLL",getItems.length);
          let getTax = await RestaurantModel.findOne({'_id':getItems[0].restaurantId}).select('restaurantName deliveryCharge itemTaxAmount').lean().exec();
                let getCount1           = getItems[0].items;
                var getCountFilter      = _.filter(getCount1, ['status', 1]);
                var getCount            = getCountFilter.reverse();
                var cartId              = getItems[0]._id;
                //var restaurantId=getItems[0].restaurantId;
                let restaurant          ={
                                  restaurantId   : getTax._id,
                                  restaurantName : getTax.restaurantName
                        }
                let subTotal              = _.sumBy(getCount, 'totalPrice');
                let items                 = _.sumBy(getCount, 'quantity');
                let tax                   = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee           = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total                 = (subTotal+tax+deliveryFee);                        
                var responseData          = { getRecords: [],subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };
                 responseData.cartId      = cartId, 
                 responseData.promotion   = 0;
                 responseData.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));
                 responseData.subTotal    = subTotal.toFixed(2);
                 responseData.items       = items;
                 responseData.restaurantId= restaurant.restaurantId?restaurant.restaurantId:""; 
                 responseData.restaurantName= restaurant.restaurantName?restaurant.restaurantName:"";                  
                 responseData.tax        = tax.toFixed(2);
                 responseData.deliveryFee= deliveryFee;
                 responseData.total      = total.toFixed(2);                        
                 responseData.getRecords = _.map(getCount, function(o) {
                       return {
                         //cartId           : cartId,
                         /*restaurantId     : restaurantId,*/
                         '_id'              : o._id,
                         'totalPrice'       : o.totalPrice,
                         'itemName'         : o.itemName, 
                         'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                         'quantity'         : o.quantity,  
                         'uuid'             : req.headers['uuid'],
                         'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                        } 
                    })
          return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("RESTAURANT_REMOVE_SUCCESS"),"data":(responseData.subTotal>0)?responseData:{}});
        }else{

          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false,'message':req.i18n.__("RESTAURANT_REMOVE_FAILED"),"data":[]});
        }               
        
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};

exports.updateCart = async function(req, res) {
  try{                 
        
        let getCart = await UserCartModel.aggregate([
            {$unwind: {
              path: '$items',
              preserveNullAndEmptyArrays:true
            }}, 
            {$match: {
              'items._id': objectId(req.params.itemCartId),
              'items.status': 1,
            }
          }]).exec();

      if(getCart!=null){
        var updateCart=getCart[0].items;
console.log("updateCart",updateCart)        ;
        var getSizeAmount    = updateCart.sizeId;
        var getMultiSize     = updateCart.multiSize;
        var sizeAmount       = (getSizeAmount)?(getSizeAmount.sizeAmount):0;
        var multiSizeAmount  = _.sumBy(getMultiSize, 'price');
console.log("multiSizeAmount",multiSizeAmount)        ;
        var additionalCharges= ((req.body.quantity)*(updateCart.packagingCharges?((updateCart.packagingCharges).toFixed(2)):0));
        var price            = ((req.body.quantity)*(updateCart.price?(updateCart.price).toFixed(2):0));
        var totalPrice       = (additionalCharges+price+sizeAmount+multiSizeAmount).toFixed(2);

        let condition = {'items._id': req.params.itemCartId, 'status': _C.status.active };
        let updateData = await UserCartModel.findOneAndUpdate(condition, {
            "$set": { "items.$.additionalCharges": additionalCharges,"items.$.quantity": req.body.quantity,"items.$.totalPrice": totalPrice }
        },{new:true});

          let getItems = await UserCartModel.find({'_id':updateData._id,'status':1}).select('_id restaurantId items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').lean().exec();
          let getTax = await RestaurantModel.findOne({'_id':getItems[0].restaurantId}).select('restaurantName deliveryCharge itemTaxAmount').lean().exec();

                let getCount1             = getItems[0].items;
                var getCountFilter        = _.filter(getCount1, ['status', 1]);
                var getCount              = getCountFilter.reverse();
                var cartId                = getItems[0]._id;                
                let restaurant            = {
                                  restaurantId   : getTax._id,
                                  restaurantName : getTax.restaurantName
                      }
                let subTotal              = _.sumBy(getCount, 'totalPrice');
                let items                 = _.sumBy(getCount, 'quantity');
                let tax                   = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee           = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total                 = (subTotal+tax+deliveryFee);                        
                var responseData          = { getRecords: [],subTotal: 0,items:0,tax:0,deliveryFee:0,total:0 };
                 responseData.cartId      = cartId, 
                 responseData.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));
                 responseData.promotion   = 0;
                 responseData.subTotal    = subTotal.toFixed(2);
                 responseData.items       = items;
                 responseData.restaurantId= restaurant.restaurantId?restaurant.restaurantId:""; 
                 responseData.restaurantName= restaurant.restaurantName?restaurant.restaurantName:"";                  
                 responseData.tax         = tax.toFixed(2);
                 responseData.deliveryFee = deliveryFee;
                 responseData.total       = total.toFixed(2);                        
                 responseData.getRecords  = _.map(getCount, function(o) {
                       return {
                        // cartId           : cartId,
                         '_id'              : o._id,
                         'totalPrice'       : o.totalPrice,
                         'itemName'         : o.itemName, 
                         'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                         'quantity'         : o.quantity,  
                         'uuid'             : req.headers['uuid'],
                         'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",
                        } 
                    })
          return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("RESTAURANT_REMOVE_SUCCESS"),"data":responseData});
        }else{

          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false,'message':req.i18n.__("RESTAURANT_REMOVE_FAILED"),"data":[]});
        }               
        
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};
exports.getList = async function(req, res) {
  try{

        var responseData = { getRecords: [],cartId:"", subTotal: 0,items:0,tax:0,deliveryFee:0,total:0};
        var updatePrice= await UserCartModel.aggregate([
              {
                '$unwind': {
                  'path': '$items', 
                  'preserveNullAndEmptyArrays': true
                }
              },
              { $sort: {'newUpdatedAt': -1 }
              }, {
                '$match': {
                  '_id'   : objectId(req.params.cartId),
                  //'restaurantId': objectId(req.params.restaurantId),
                  'items.status': _C.status.active
                }
              }
         ]);
        
        if(updatePrice && updatePrice.length>0){
                
                let getItems = await UserCartModel.find({'_id':req.params.cartId }).select('restaurantId _id updateAt items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').sort({'items.updateAt':-1}).lean().exec();
                let getCount1           = getItems[0].items;
                var restaurantId        = getItems[0].restaurantId;
                var cartId              = getItems[0]._id;                
                var getTax              = await RestaurantModel.findOne({'_id':getItems[0].restaurantId,'status':1}).select('deliveryCharge itemTaxAmount restaurantName').lean().exec();  
                var getCountFilter      = _.filter(getCount1, ['status', 1]); 
                var getCount            = getCountFilter.reverse();               
                let subTotal            = _.sumBy(getCount, 'totalPrice');
                let items               = _.sumBy(getCount, 'quantity');
                let tax                 = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee         = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total               = (subTotal+tax+deliveryFee);
                let restaurant          = {
                                  restaurantId   : getTax._id,
                                  restaurantName : getTax.restaurantName
                      }            
                responseData.cartId      = cartId,
                responseData.promotion   = 0;
                responseData.restaurantId= restaurant.restaurantId?restaurant.restaurantId:""; 
                responseData.restaurantName= restaurant.restaurantName?restaurant.restaurantName:""; 
                responseData.createdAt   = (moment(getCount.updateAt).format('DD-MM-YYYY h:mm'));                 
                responseData.subTotal    = subTotal.toFixed(2);
                responseData.items       = items;
                responseData.tax         = tax.toFixed(2);
                responseData.deliveryFee = deliveryFee;
                responseData.total       = total.toFixed(2);
                responseData.getRecords  = _.map(getCount, function(o) {
                       return {

                         '_id'              : o._id,
                         'totalPrice'       : o.totalPrice,
                         'itemName'         : o.itemName, 
                         'additionalCharges': o.additionalCharges?o.additionalCharges:"",                
                         'quantity'         : o.quantity,  
                         'uuid'             : req.headers['uuid'],
                         'itemImage'        : o.itemImage?`${Config.server.uri}${_C.path.foodItemImagePath}` +o.itemImage:"",              
                        }                
                    })

          if(getItems){

            return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("RESTAURANT_LIST_SUCCESS"),'data':/*getItems[0]*/responseData});               

          }
      }
      return res.status(HttpStatus.OK).json({ 'success': false,'message':req.i18n.__("RESTAURANT_LIST_FAILED"),'data':[]});               
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};


async function checkVoucher(userId, promoCode, totalFee) {
    try {
        if (userId && promoCode) {
            let discountAmount = 0;
            let currentDate = Helper.dayStartUTC(Date.now());
            let voucher = await PromoCodeModel
                .find({
                    minimumOrderAmount: { '$lte': totalFee },
                    /*startDate: { '$gte': currentDate },
                    endDate  :  { '$lte': currentDate },                    */
                    expireDate: { '$gt': currentDate },
                    status: _C.status.active,
                    promoCode: promoCode
                }                
                )
                .limit(1)
                .exec();
                console.log("promotion",voucher);
            if(voucher && voucher.length > 0){
                let valid = true, errmsg = null;
                if((voucher[0].promoType === 2 && totalFee < voucher[0].promoOffer)){
                    valid = false;
                    errmsg = 'FEE_LESS_THAN_DISCOUNT_AMOUNT';
                } /*else if(voucher[0].promoUsed && voucher[0].promoUsed.length > 0){
                    let usedLimit = _.find(voucher[0].promoUsed, ['user_id', userId]);
                    if(usedLimit){
                        let usedCount = usedLimit.usedCount + 1;
                        if(usedLimit.usedCount > 0 && usedCount > voucher[0].limit){
                            valid = false;
                            errmsg = 'USAGE_LIMIT_EXCEED';
                        }
                    }
                }*/
                if(valid){
                    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%5",totalFee)

                    let discountedPrice = 0;
                    switch(voucher[0].promoType){
                        case 2: {
                            discountAmount = voucher[0].promoOffer;
                            discountedPrice = totalFee - voucher[0].promoOffer;
                        }
                        break;
                        case 1: {
                            discountedPrice = totalFee *((voucher[0].promoOffer)/100) /*((100 - voucher[0].promoOffer) / 100)*/; //**TD086* Discount percentage calculation
                            discountAmount = totalFee - discountedPrice;
                            /*if(discountAmount > voucher[0].maxmimum_discount_amount){
                                discount_amount = voucher[0].maxmimum_discount_amount;
                                discountedPrice = totalFee - voucher[0].maxmimum_discount_amount;
                            }*/
                            console.log("discountedPrice",discountedPrice)
                            console.log("discountAmount",discountAmount)
                        }
                        break;
                    }
                    return { status: 200, data: { discountedPrice: discountedPrice,discountAmount:discountAmount } }
                }
                throw ({ errmsg: errmsg })
            }
            throw ({ errmsg: "INVALID_VOUCHER" })
        } else {
            throw ({ errmsg: "INVALID_VOUCHER" })
        }
    } catch (err) {
        console.log("err", err);
        return { status: 404, errmsg: err.errmsg, error: err };
    }
}

exports.OrderVoucher = async(req, res) => {
    try {
        if(req.body.promoCode){
            let booking = await OrderModel.find({ /*status: Constants.status.inactive,*/ userId: req.params.userId,_id: req.params.orderId })
            if(booking && booking.length > 0){
                if(booking[0].subTotal && booking[0].subTotal > 0){
                    let bookingData = {}, validVouncher = true, voucherErrmsg = null;
                    if(booking[0].promoCode){
                        bookingData.promoCode = "";
                        bookingData['discountAmount'] = 0;
                        bookingData['total'] = booking[0].total + booking[0].discountAmount;
                    } else if(booking[0].total > 0){ 
                        
                        let discount = await checkVoucher(booking[0].userId, req.body.promoCode, booking[0].total);
                        console.log("discount",discount);
                        if(discount.status === 200){
                            bookingData.promoCode = req.body.promoCode;
                            bookingData['discountAmount'] = discount.data.discountedPrice;
                            bookingData['total'] = discount.data.discountAmount;
                        } else {
                            validVouncher = false;
                            voucherErrmsg = discount.errmsg;
                        }
                    } else {
                        throw ({ errmsg: 'INVALID_FEE' });
                    }

                    if(validVouncher){
                        let bookingDiscount = await OrderModel.findOneAndUpdate({ /*status: Constants.status.inactive,*/ userId: req.params.userId,_id: req.params.orderId }, bookingData, { new: true }).exec();
                    console.log("discountssssssssssssss",bookingDiscount);
                        if(bookingDiscount){
                            let data = {
                                promoCode: bookingDiscount.promoCode,
                                delivery_charge: bookingDiscount.deliveryCharge                               
                            }
                            //return { statusCode: 200, message: (booking[0].promoCode) ? "VOUCHER_REMOVED" : "VOUCHER_APPLIED", data: data, error: {} };
                            return res.status(HttpStatus.OK).json({'message': (booking[0].promoCode) ? "VOUCHER_REMOVED" : "VOUCHER_APPLIED", data: data, error: {}});
                        } else {
                            throw ({ errmsg: "VOUCHER_FAILED" })
                        }
                    } else {
                        throw ({ errmsg: voucherErrmsg })
                    }
                } else {
                    throw ({ errmsg:'VOUCHER_NOT_APPLICABLE' })
                }
            } else {
                throw ({ errmsg: "INVALID_BOOKING" })
            }
        } else {
            throw ({ errmsg: "INVALID_VOUCHER" })
        }
        
    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});
    }
}










































/*No Need This one*/
exports.getCartList = async function(req, res) {
  try{                 
        
        let getCart = await UserCartModel.aggregate([
            {$unwind: {
              path: '$items',
              preserveNullAndEmptyArrays:true
            }}, 
            {$match: {
              'items._id': objectId(req.params.itemCartId),
              'items.status': 1,
            }
          }]).exec();
        console.log("getCart^^^^^^^^^^^^^^^^^^^^^66",getCart);
      if(getCart!=null){
        var updateCart=getCart[0].items;
        console.log("updateData",updateCart.packagingCharges)
        var additionalCharges=((req.body.quantity)*(updateCart.packagingCharges?((updateCart.packagingCharges).toFixed(2)):0));
                console.log("totalPrice",additionalCharges);
        var price=((req.body.quantity)*(updateCart.price?(updateCart.price).toFixed(2):0));
                console.log("totalPrice",price);
        var totalPrice=(additionalCharges+price).toFixed(2);
                console.log("totalPrice",totalPrice);

        let condition = {'items._id': req.params.itemCartId, 'status': _C.status.active };
        let updateData = await UserCartModel.findOneAndUpdate(condition, {
            "$set": { "items.$.additionalCharges": additionalCharges,"items.$.quantity": req.body.quantity,"items.$.totalPrice": totalPrice }
        },{new:true});
                console.log("topic_delete", updateData);
          let getItems = await UserCartModel.find({'cartKey':_C.cartKey,'status':1}).select('items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').lean().exec();
          let getCount1=getItems[0].items;
          var cartId=getItems[0]._id;
          var restaurantId=getItems[0].restaurantId;
          let getTax   = await RestaurantModel.findOne({'restaurantId':restaurantId,'status':1}).select('deliveryCharge itemTaxAmount restaurantName').lean().exec();
console.log("getTax",getTax);
                
                var getCount    = _.filter(getCount1, ['status', 1]);                
                let subTotal    = _.sumBy(getCount, 'totalPrice');
                let items       =_.sumBy(getCount, 'quantity');                        
                let tax         = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total       = (subTotal+tax+deliveryFee);
                let restaurant  ={
                          restaurantId   : getTax._id,
                          restaurantName : getTax.restaurantName
                }
              var responseData = { getRecords: [],restaurant:{},cartId:"", SubTotal: 0,items:0,Tax:0,deliveryFee:0,Total:0};

                 responseData.cartId     = cartId,
                 responseData.restaurant = restaurant,
                 responseData.SubTotal   = subTotal.toFixed(2);
                 responseData.Tax        = tax.toFixed(2);
                 responseData.deliveryFee= deliveryFee;
                 responseData.Total      = total.toFixed(2);
                 
                 //responseData.restaurantName = getTax.restaurantName;
                 responseData.getRecords = _.map(getCount, function(o) {
                  console.log("66666666666666666666666",o.status)
                       return {                         
                         _id              : o._id,
                         totalPrice       : o.totalPrice,
                         itemName         : o.itemName, 
                         additionalCharges: o.additionalCharges?o.additionalCharges:"",                
                         quantity         : o.quantity,  
                         uuid             : req.headers['uuid'],
                         itemImage        : o.itemImage               
                        } 
                    })
          return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("GET_CART_LISTED"),"data":responseData});
        }else{

          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false,'message':req.i18n.__("GET_CART_FAIL"),"data":[]});
        }               
        
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};

exports.getCheckOutList = async function(req, res) {
  try{                 
        
        
          let getItems = await UserCartModel.find({'_id':req.params.cartId,'status':1}).select('items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').lean().exec();
          console.log("getItems",getItems)
          if(getItems && getItems.length>0){
          let getCount1=getItems[0].items;
          var cartId=getItems[0]._id;
          var restaurantId=getItems[0].restaurantId;
          let getTax   = await RestaurantModel.findOne({'restaurantId':restaurantId,'status':1}).select('deliveryCharge itemTaxAmount restaurantName').lean().exec();
console.log("getTax",getTax);
                
                var getCount    = _.filter(getCount1, ['status', 1]);                
                let subTotal    = _.sumBy(getCount, 'totalPrice');
                let tax         = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total       = (subTotal+tax+deliveryFee);
                let restaurant  ={
                          restaurantId   : getTax._id,
                          restaurantName : getTax.restaurantName
                }
              var responseData = { getRecords: [], SubTotal: 0,restaurant:{},cartId:"",Tax:0,deliveryFee:0,Total:0};

                 responseData.cartId     = cartId,
                 responseData.restaurant = restaurant,
                 responseData.SubTotal   = subTotal.toFixed(2);
                 responseData.Tax        = tax.toFixed(2);
                 responseData.deliveryFee= deliveryFee;
                 responseData.Total      = total.toFixed(2);
                 
                 //responseData.restaurantName = getTax.restaurantName;
                 responseData.getRecords = _.map(getCount, function(o) {
                  console.log("66666666666666666666666",o.status)
                       return {                         
                         _id              : o._id,
                         totalPrice       : o.totalPrice,
                         itemName         : o.itemName, 
                         additionalCharges: o.additionalCharges?o.additionalCharges:"",                
                         quantity         : o.quantity,  
                         uuid             : req.headers['uuid'],
                         itemImage        : o.itemImage               
                        } 
                    })
          return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("GET_CART_LISTED"),"data":responseData});
        }else{

          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false,'message':req.i18n.__("GET_CART_FAIL"),"data":[]});
        }               
        
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};

exports.getCartList = async function(req, res) {
  try{                 
        
        let getCart = await UserCartModel.aggregate([
            {$unwind: {
              path: '$items',
              preserveNullAndEmptyArrays:true
            }}, 
            {$match: {
              'items._id': objectId(req.params.itemCartId),
              'items.status': 1,
            }
          }]).exec();
        console.log("getCart^^^^^^^^^^^^^^^^^^^^^66",getCart);
      if(getCart!=null){
        var updateCart=getCart[0].items;
        console.log("updateData",updateCart.packagingCharges)
        var additionalCharges=((req.body.quantity)*(updateCart.packagingCharges?((updateCart.packagingCharges).toFixed(2)):0));
                console.log("totalPrice",additionalCharges);
        var price=((req.body.quantity)*(updateCart.price?(updateCart.price).toFixed(2):0));
                console.log("totalPrice",price);
        var totalPrice=(additionalCharges+price).toFixed(2);
                console.log("totalPrice",totalPrice);

        let condition = {'items._id': req.params.itemCartId, 'status': _C.status.active };
        let updateData = await UserCartModel.findOneAndUpdate(condition, {
            "$set": { "items.$.additionalCharges": additionalCharges,"items.$.quantity": req.body.quantity,"items.$.totalPrice": totalPrice }
        },{new:true});
                console.log("topic_delete", updateData);
          let getItems = await UserCartModel.find({'cartKey':_C.cartKey,'status':1}).select('items._id items.status uuid items.quantity items.totalPrice items.additionalCharges items.itemImage items.itemName').lean().exec();
          let getCount1=getItems[0].items;
          var cartId=getItems[0]._id;
          var restaurantId=getItems[0].restaurantId;
          let getTax   = await RestaurantModel.findOne({'restaurantId':restaurantId,'status':1}).select('deliveryCharge itemTaxAmount restaurantName').lean().exec();
console.log("getTax",getTax);
                
                var getCount    = _.filter(getCount1, ['status', 1]);                
                let subTotal    = _.sumBy(getCount, 'totalPrice');
                let tax         = ((subTotal)*(getTax.itemTaxAmount?getTax.itemTaxAmount:0));   
                let deliveryFee = (getTax.deliveryCharge)?(getTax.deliveryCharge):0;
                let total       = (subTotal+tax+deliveryFee);
                let restaurant  ={
                          restaurantId   : getTax._id,
                          restaurantName : getTax.restaurantName
                }
              var responseData = { getRecords: [],restaurant:{},cartId:"", SubTotal: 0,Tax:0,deliveryFee:0,Total:0};

                 responseData.cartId     = cartId,
                 responseData.restaurant = restaurant,
                 responseData.SubTotal   = subTotal.toFixed(2);
                 responseData.Tax        = tax.toFixed(2);
                 responseData.deliveryFee= deliveryFee;
                 responseData.Total      = total.toFixed(2);
                 
                 //responseData.restaurantName = getTax.restaurantName;
                 responseData.getRecords = _.map(getCount, function(o) {
                  console.log("66666666666666666666666",o.status)
                       return {                         
                         _id              : o._id,
                         totalPrice       : o.totalPrice,
                         itemName         : o.itemName, 
                         additionalCharges: o.additionalCharges?o.additionalCharges:"",                
                         quantity         : o.quantity,  
                         uuid             : req.headers['uuid'],
                         itemImage        : o.itemImage               
                        } 
                    })
          return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("GET_CART_LISTED"),"data":responseData});
        }else{

          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false,'message':req.i18n.__("GET_CART_FAIL"),"data":[]});
        }               
        
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'message':(err.errmsg)?(err.errmsg):err});

  }

};

exports.newOrders = async function(req, res) {


try{
    
    let userQuery = { '_id': req.params.cartId, status: _C.status.active },select_fields = 'uuid';
    let checkUser = await new UserCartModel().getUser({ query: userQuery, fields: select_fields });
    let user = await UserModel().getUser({ cond: { '_id': req.body.userId, status: _C.status.user.online }, select: '_id' });
    /*let dataForCalculation = {
                        pickupLatitude: postData.pickup_latitude,
                        pickupLongitude: postData.pickup_longitude,
                        deliveryLatitude: this_delivery.delivery_latitude,
                        deliveryLongitude: this_delivery.delivery_longitude,
                        standard_fee: delvieryItemType.standard_fee,
                        base_delivery_fee: vehicleType.base_delivery_fee,
                        base_distance: vehicleType.base_distance,
                        additional_fee: vehicleType.additional_fee
                    }
*/    let delvieryFeeData = await Helper.deliveryFeeCalculation();

    console.log("dddddddddddddddddddd",user)
      return res.status(HttpStatus.OK).json({ 'success': false,'message':req.i18n.__("RESTAURANT_LIST_FAILED"),'data':checkUser});               
        
  }catch(err){
      console.log(err);            
      
      return res.status(HttpStatus.NOT_FOUND).json({'success': false,'message':(err.errmsg)?(err.errmsg):err,'data':[]});

  }

};


exports.getMenu1  = async (req, res) => {
  
  try{  
        console.log("req.body",req.body.quantity);
        /*var number=req.body.quantity;
        console.log("packagingCharges11111111111",number)*/
        let getFood=await FoodItemModel.aggregate([
          {
            '$unwind': {
              'path': '$itemDetails', 
              'preserveNullAndEmptyArrays': true
            }
          }, {
            '$unwind': {
              'path': '$itemDetails.tag', 
              'preserveNullAndEmptyArrays': true
            }
          },
          {
           '$project': {
              "_id":1,
              "foodId":'$itemDetails.foodId',
              "name":"$itemDetails.name",
              "restaurantId":1,
              "description":'$itemDetails.description',
              "isPackage":'$itemDetails.isPackage',
              "additionalCharges":"$itemDetails.packagingCharges",
              "addOns":"$itemDetails.addOns",
              "tagName":"$itemDetails.tag.tagName",
              "tagId" :"$itemDetails.tag.tagId",
              "availableStatus":'$itemDetails.availableStatus',
              "price":'$itemDetails.price',
              "availableStatus":'$itemDetails.availableStatus',
              "itemImage":"$itemDetails.itemImage"
              //"quantity":/*'$itemDetails.quantity'*/number(req.body.quantity),              
              //"total":{ $multiply:[ "$itemDetails.price", "$quantity"]}            
          }
        },
        {"$match" : {'foodId' : objectId(req.params.foodId),
                     'tagId'  : objectId(req.params.tagId)
                    },
        }
        ]);


        if(getFood && getFood.length >0){
            var getRecords = _.map(getFood, function(o) {
              var packagingCharges=((req.body.quantity)*(o.additionalCharges))
               return {
                 _id              : o._id,
                 foodId           : o.foodId,
                 restaurantId     : o.restaurantId,
                 name             : o.name,
                 description      : o.description,
                 isPackage        : o.isPackage,
                 additionalCharges:o.additionalCharges,
                 addOns:o.addOns,
                 tagName:o.tagName,
                 tagId:o.tagId,
                 availableStatus:o.availableStatus,
                 price:o.price,
                 availableStatus:o.availableStatus,
                 quantity:(req.body.quantity),
                 total:((packagingCharges)+(o.price))

                }                
            })    
            var updateData=getRecords[0];
            console.log("DDDDDDDDDDDDDd",updateData)
            if(req.headers['uuid']){
              console.log("helllllllllo");
              let updateCart = await UserCartModel.update(
                { restaurantId: updateData.restaurantId ,
                  'uuid'      : req.headers['uuid']
                }, 
                {
                    'uuid'    : req.headers['uuid'],
                    'status'  : _C.status.active,
                    'restaurantId':updateData.restaurantId,
                    'cartKey' : _C.cartKey,
                    $push: { 'items': 
                                 { 'foodId'    : req.params.foodId,
                                   'itemName'  : updateData.name, 
                                   'price'     : updateData.price,
                                   'totalPrice': updateData.total,
                                   'quantity'  : updateData.quantity,
                                   'status'    : 1
                                 }
                    }            
              },
              {upsert:true,multi:true}).exec();

            }else{
            /*var checkCart= await UserCartModel.find({                  
                  'status'  : _C.status.active,
                  //'restaurantId':updateData.restaurantId,
                  'cartKey' : _C.cartKey}).exec();
            console.log("checkCart&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",checkCart);
            if(checkCart && checkCart.length>=0){*/
            var updateCart = await UserCartModel.findOneAndUpdate(
              { restaurantId : updateData.restaurantId,
                //userId       : req.body.userId,
                cartKey      : _C.cartKey
                 },  
              {
                  'userId'  : req.body.userId,
                  'status'  : _C.status.active,
                  'restaurantId':updateData.restaurantId,
                  'cartKey' : _C.cartKey,
                  $push: { 'items': 
                               { 'foodId'    : req.params.foodId,
                                 'itemName'  : updateData.name, 
                                 'price'     : updateData.price,
                                 'totalPrice': updateData.total,
                                 'quantity'  : updateData.quantity,
                                 'status'    : 1
                               }
                  }            
              },
              {upsert:true,multi:true}).exec();
            console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",updateCart) 
            //if(updateCart==null){             

                  var responseData = { getRecords: [], subTotal: 0,items:0 };
                  var updatePrice= await UserCartModel.aggregate([
                    {
                      '$unwind': {
                        'path': '$items', 
                        'preserveNullAndEmptyArrays': true
                      }
                    },
                    {
                      '$match': {
                        /*'items._id'   : objectId(req.params.cartId),
                        'restaurantId': objectId(req.params.restaurantId),*/
                        'items.status': _C.status.active
                      }
                    }
               ]);
              console.log("getRRRRRRRRRRRRRr",updatePrice)
              if(updatePrice && updatePrice.length>0){
                      let updateItem=((req.body.quantity)*(updatePrice[0].items.price));
                      console.log("fffffffffffffffffffffffffffffffffffffffffff",updateItem)
                      let updateValue={
                        "items.$.totalPrice": updateItem,
                        "items.$.quantity"  : req.body.quantity
                      };
                      let updateData = await UserCartModel.update({ 'items._id': req.params.cartId, status: _C.status.active }, {
                          "$set": updateValue
                      });
                      let getItems = await UserCartModel.find({/*'restaurantId':req.params.restaurantId */'cartKey':_C.cartKey}).select('-_id items.quantity items.totalPrice items.itemName').sort({'items.updateAt':-1}).lean().exec();
                      console.log("ggggggggggggggggggggggggggggggggggggggg",getItems)
                      let getCount=getItems[0].items;
                      let subTotal =_.sumBy(getCount, 'totalPrice');
                      let items =_.sumBy(getCount, 'quantity');        
                      let data={
                              "subTotal":subTotal,
                              "items":items
                      }
                       responseData.subTotal = subTotal.toFixed(2);
                       responseData.items = items;
                       responseData.getRecords = _.map(getCount, function(o) {
                             return {
                               _id              : o._id,
                               totalPrice       : o.totalPrice,
                               itemName         : o.itemName, 
                               additionalCharges: o.additionalCharges?o.additionalCharges:"",                
                               quantity         : o.quantity,                 
                              }                
                          })

                if(getItems){

                  return res.status(HttpStatus.OK).json({ 'success': true,'message':req.i18n.__("RESTAURANT_LIST_SUCCESS"),'data':/*getItems[0]*/responseData});               
                }
              }
            /*}else{
              var clearCart=await UserCartModel.findOneAndRemove({'cartKey' :_C.cartKey});
              return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':"clearCart","data":[]});

            }*/
      }
            
      }
      return res.status(HttpStatus.OK).json({ 'success': false,'message':req.i18n.__("RESTAURANT_LIST_FAILED"),'data':[]});               
        
         /*return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("RESTAURTANT_DATA_SUCCESS"),'data':updateCart}); 
            
        }
         return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':req.i18n.__("RESTAURTANT_NOT_FOUND"),'data':[]}); 
         */                         
  }catch (err) {
        console.log('cccccccccccccc',err.code);  
        if (err.code == 11000) {
              var clearCart=await UserCartModel.findOneAndRemove({'cartKey' :_C.cartKey});
                err.errmsg = {"cart":req.i18n.__("clearCart")};
            }          
          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err,"data":[]});

  }
};


