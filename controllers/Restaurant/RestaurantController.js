const UserRoute = require('express').Router();
const RestaurantModel = require('../../models/Restaurant');
const objectId = require('mongoose').Types.ObjectId;
const RestaurantTimingModel = require('../../models/RestaurantTiming');
const RestaurantMenuModel = require('../../models/RestaurantMenu');
const AvailableCityModel = require('../../models/AvailableCity');
const FoodItemModel = require('../../models/RestaurantMenu');
const FoodModel = require('../../models/Cuisine')
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
const _ = require('lodash');
const moment = require('moment');
const HashService = require('../../services/helper');


/** 
 * Add Cuisine
 * url : /api/admin/restaurantTiming/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.addTiming = async (req, res) => {

  try {
    console.log("addTiming");

    var postData = req.body;
    console.log("chatInfo", postData);
    var newDoc = new RestaurantTimingModel({
      'restaurantId': req.body.restaurantId,
      'timing': [{
        'days': req.body.days,
        'openingTime1': req.body.openingTime1,
        'openingTime2': req.body.openingTime2,
        'closingTime1': req.body.closingTime1,
        'closingTime2': req.body.closingTime1
      }]
    });
    await newDoc.save();

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_TIMING_SUCCESS") });

  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};


/** 
 * Add Cuisine
 * url : /api/admin/restaurantMenu/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.addMenu = async (req, res) => {

  try {
    let newDoc = new RestaurantMenuModel(req.body);
    let checkUnique = await RestaurantMenuModel.find({ 'foodItemName': newDoc.foodItemName });
    if (checkUnique && checkUnique.length > 0) {
      throw { errmsg: "FOOD_NAME_UNIQUE_ERROR" }
    } else {

      newDoc = await newDoc.save();
    }

    if (newDoc && newDoc.length !== 0) {

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_DATA_SUCCESS"), 'data': newDoc });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      err.errmsg = req.i18n.__("ADMIN_UNIQUE_ERROR");
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};


/** 
 * Add Cuisine
 * url : /api/admin/cuisine/add
 * method : POST
 * author : Sathyamoorthi.R 
*/

exports.list = async (req, res) => {

  try {

    let getCategory = await RestaurantModel.find({ 'status': _C.status.adminPanel.active }).populate({ path: 'cuisineId', select: 'cuisineName -_id' }).populate({ path: 'restaurantTimingId', select: 'hours -_id' }).exec();
    console.log("$$$$$$$$$$$$$$$$", getCategory)

    if (getCategory && getCategory.length > 0) {
      var Restaurant = _.map(getCategory, function (o) {
        return {
          _id: o._id,
          restaurantName: o.restaurantName,
          cuisineId: (o.cuisineId) ? o.cuisineId : "",
          offer: (o.offer) ? (o.offer) + "%" : "",
          rating: (o.rating) ? o.rating : "",
          deliveryTimeLabel: (o.deliveryTimeLabel) ? o.deliveryTimeLabel : "",
          couponCode: (o.couponCode) ? o.couponCode : "",
          costForTwo: (o.costForTwo) ? o.costForTwo : "",
          restaurantTiming: (o.restaurantTimingId) ? o.restaurantTimingId : ""
        }
      })
    }

    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': Restaurant });

  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};

exports.getAvailableCity = async (req, res) => {

  try {

    let getCategory1 = await AvailableCityModel.find({}).sort({ 'city': 1 }).lean().exec();
    console.log("&&&&&&&&&&&&&&&", getCategory1);
    let getCategory = _.sortBy(getCategory1, 'city');
    console.log("$$$$$$$$", getCategory)


    if (getCategory && getCategory.length > 0) {
      var Restaurant = _.map(getCategory, function (o) {
        return {
          city: o.city
        }
      })
    }

    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("AVAILABLE_CITY_LIST_SUCCESS"), 'data': getCategory1 });

  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};
/** 
 * Add Cuisine
 * url : /api/admin/restaurantTiming/add
 * method : POST
 * author : Sathyamoorthi.R 
*/

exports.getRestaurantCategory = async (req, res) => {

  try {

    let getCategory = await RestaurantModel.find({ 'status': _C.status.adminPanel.active, 'cuisineId': req.params.cuisineId }).populate({ path: 'cuisineId', select: 'cuisineName -_id' }).exec();

    if (getCategory && getCategory.length > 0) {
      var Restaurant = _.map(getCategory, function (o) {
        return {
          _id: o._id,
          restaurantName: o.restaurantName,
          cuisineId: (o.cuisineId) ? o.cuisineId : "",
          offer: (o.offer) ? (o.offer) + "%" : "",
          rating: (o.rating) ? o.rating : "",
          deliveryTimeLabel: (o.deliveryTimeLabel) ? o.deliveryTimeLabel : "",
          couponCode: (o.couponCode) ? o.couponCode : "",
          costForTwo: (o.costForTwo) ? o.costForTwo : ""
        }
      })
    }

    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': Restaurant });

  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};

exports.searchCuisine = async (req, res) => {
  console.log("query", req.query);

  var cond = { status: 1 };
  var userCond = {};

  try {
    for (let param in req.query) {
      console.log("query111111111111111111111", req.query[param]);
      if (param === 'cuisineName') {
        userCond[`cuisineId.cuisineName`] = { '$regex': req.query[param], '$options': 'i' };
      } else
        cond[param] = req.query[param];
    }

    let rating = await RestaurantModel.aggregate([
      {
        "$lookup": {
          "localField": "cuisineId",
          "from": "cuisine",
          "foreignField": "_id",
          "as": "cuisineId"
        }
      }, {
        "$unwind": "$cuisineId",
      },
      {
        "$match": userCond
      },
      {
        "$project": {

          "cuisineName": "$cuisineId.cuisineName"
        }
      }
    ]).exec();
    console.log("rating", rating);
    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': rating });
  } catch (err) {
    console.log(err);

    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

  }
};



exports.Getlocation = async (req, res) => {
  try {
    let now = new Date();
    let weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let day = weekday[now.getDay()];
    //let seconds = now.getSeconds() + (60 * (now.getMinutes() + (60 * now.getHours())));
    let seconds = (now.getMinutes() + (60 * now.getHours()));
    console.log("seconds11111111111111111111111111", seconds)
    let getFormat = moment().startOf('day').seconds(seconds).format('HH:mm');
    let total = 0, perPage = _C.pagination.pageSize, page = req.params.page || 1;

    let getRestaurant = await RestaurantModel.find({ restaurantLocation: { $near: { $geometry: { type: "Point", coordinates: [req.params.longitude, req.params.latitude] }, $maxDistance: 1000 } } })
      .populate('cuisineId', 'cuisineName _id')
      .populate('restaurantTimingId', 'hours -_id')
      .sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage).lean().exec();
    let getAvailableCity = await AvailableCityModel.find({}).sort({ 'city': 1 }).select('city -_id').lean().exec();

    var filterDoc = [];
    if (getRestaurant && getRestaurant.length > 0) {
      let cuisineSearch = (req.query.searchName) ? true : false;
      let restaurantNameSearch = (req.query.searchName) ? true : false;
console.log("cuisineSearch",req.query.searchName)
console.log("cuisineSearch",cuisineSearch)

      if (cuisineSearch) {
        _.filter(getRestaurant, (el) => {
          _.filter(el.cuisineId, (val) => {
            if (new RegExp('^' + req.query.searchName, 'i').test(val.cuisineName)) {
              filterDoc.push(el);
            }
          })
        })
      }

      else if (restaurantNameSearch) {
        _.filter(getRestaurant, (el) => {
          if (new RegExp('^' + req.query.searchName, 'i').test(el.restaurantName)) {
            filterDoc.push(el);
          }
        })
      }
      if (restaurantNameSearch) {
        _.filter(getRestaurant, (el) => {
          if (new RegExp('^' + req.query.searchName, 'i').test(el.restaurantName)) {
            filterDoc.push(el);
          }
        })
      }

      else if (!cuisineSearch && !restaurantNameSearch) {
        filterDoc = getRestaurant;
      }
      total = filterDoc.length;
      let Restaurant = _.map(filterDoc, function (o) {
        let weekDay = (day == 'monday') ? o.restaurantTimingId.hours.monday : (day == 'tuesday') ? o.restaurantTimingId.hours.tuesday : (day == 'wednesday') ? o.restaurantTimingId.hours.wednesday : (day == 'thursday') ? o.restaurantTimingId.hours.thursday : (day == 'friday') ? o.restaurantTimingId.hours.friday : (day == 'saturday') ? o.restaurantTimingId.hours.saturday : o.restaurantTimingId.hours.sunday;

        let getDay = _.map(weekDay, function (t) {
          if ((t.opening) <= seconds && (t.closing) >= seconds) {
            return {
              openingLabel: t.openingLabel,
              opening      : t.opening,
              closing      : t.closing,
              closingLabel: t.closingLabel
            }
          }
          else {
            return {
              openingLabel : 'closed',              
              opening      : t.opening,
              closing      : t.closing,
              closingLabel: t.closingLabel
            }
          }
          return getDay;
        })
        var getDayCount    = _.filter(getDay, function(day) {
              return ((day.opening <= seconds) && (day.closing >= seconds));
        });
        var getDayCount1    = _.filter(getDay,['openingLabel', 'closed']);
        var getDayCount2    = _.filter(getDayCount1, function(day) {
              if((day.opening <= seconds) && (day.closing >= seconds)){
                return day.openingAt;
                }
        });
        console.log("getDayCount1",getDay)

        return {
          _id: o._id,
          restaurantName: o.restaurantName,
          cuisineName: (o.cuisineId) ? o.cuisineId : "",
          offer: (o.offer) ? (o.offer) + "%" : "",
          rating: (o.rating) ? o.rating : "",
          deliveryTimeLabel: (o.deliveryTimeLabel) ? o.deliveryTimeLabel : "",
          couponCode: (o.couponCode) ? o.couponCode : "",
          costForTwo: (o.costForTwo) ? o.costForTwo : "",
          addtionalNote: (o.addtionalNote) ? (o.addtionalNote) : "",
          restaurantImage: (o.restaurantImage) ? `${Config.server.uri}${_C.path.restaurantImagePath}` + (o.restaurantImage) : "",
          //restaurantTiming: getDay,
          //checkTiming       : getDayCount,
          currentlyAvailable: (getDay && getDay.length!==0) ? true : false,          
          currentlyOpening  : (getDayCount && getDayCount.length!==0)? true:false,
          nextOpening       : (getDayCount.length==0)? getDayCount2:"",
        }
      })
      var filter=_.sortBy(Restaurant, { 'currentlyOpening':true  }).reverse();
      return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'total': total, 'data': filter ? (filter) : [] });
    }
    return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': false, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': getAvailableCity ? (getAvailableCity) : [] });
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};

exports.GetCusineFilter = async (req, res) => {

  try {
    let now = new Date();
    let weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let day = weekday[now.getDay()];
    let seconds = now.getSeconds() + (60 * (now.getMinutes() + (60 * now.getHours())));
    let getFormat = moment().startOf('day').seconds(seconds).format('HH:mm');
    //let total     = 0,perPage =_C.pagination.pageSize,page = req.params.page || 1;  

    let getRestaurant = await RestaurantModel.find({ restaurantLocation: { $near: { $geometry: { type: "Point", coordinates: [req.params.longitude, req.params.latitude] }, $maxDistance: 1000 } } })
      .populate('restaurantTimingId', 'hours -_id')
      .populate('cuisineId', 'cuisineName _id')

    /*.sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage)*/.lean().exec();
    let getAvailableCity = await AvailableCityModel.find({}).sort({ 'city': 1 }).select('city -_id').lean().exec();


    var filterDoc = [];
    if (getRestaurant && getRestaurant.length > 0) {
      let cuisineSearch = (typeof req.query.searchName === "undefined" || req.query.categoryName === "") ? false : true;
      let restaurantNameSearch = (typeof req.query.searchName === "undefined" || req.query.restaurantName === "") ? false : true;

      if (cuisineSearch) {
        _.filter(getRestaurant, (el) => {
          _.filter(el.cuisineId, (val) => {
            if (new RegExp('^' + req.query.searchName, 'i').test(val.cuisineName)) {
              filterDoc.push(el);
            }
          })
        })
      }
      else if (restaurantNameSearch) {
        _.filter(getRestaurant, (el) => {
          if (new RegExp('^' + req.query.searchName, 'i').test(el.restaurantName)) {
            filterDoc.push(el);
          }
        })
      }

      if (restaurantNameSearch) {
        _.filter(getRestaurant, (el) => {
          if (new RegExp('^' + req.query.searchName, 'i').test(el.restaurantName)) {
            filterDoc.push(el);
          }
        })
      }

      else if (!cuisineSearch && !restaurantNameSearch) {
        filterDoc = getRestaurant;
      }
      total = filterDoc.length;
      let Restaurant = _.map(filterDoc, function (o) {
        let weekDay = (day == 'monday') ? o.restaurantTimingId.hours.monday : (day == 'tuesday') ? o.restaurantTimingId.hours.tuesday : (day == 'wednesday') ? o.restaurantTimingId.hours.wednesday : (day == 'thursday') ? o.restaurantTimingId.hours.thursday : (day == 'friday') ? o.restaurantTimingId.hours.friday : (day == 'saturday') ? o.restaurantTimingId.hours.saturday : o.restaurantTimingId.hours.sunday;

        let getDay = _.map(weekDay, function (t) {
          if ((t.opening) <= seconds && (t.closing) >= seconds) {
            return {
              openingLabel: t.openingLabel,
              closingLabel: t.closingLabel
            }
          }
          else {
            return {
              openingLabel: 'closed',
              openingAt: t.openingLabel
            }
          }
          return getDay;
        })
        return {
          _id: o._id,
          restaurantName: o.restaurantName,
          cuisineName: (o.cuisineId) ? o.cuisineId : "",
          offer: (o.offer) ? (o.offer) + "%" : "",
          rating: (o.rating) ? o.rating : "",
          deliveryTimeLabel: (o.deliveryTimeLabel) ? o.deliveryTimeLabel : "",
          couponCode: (o.couponCode) ? o.couponCode : "",
          costForTwo: (o.costForTwo) ? o.costForTwo : "",
          addtionalNote: (o.addtionalNote) ? (o.addtionalNote) : "",
          restaurantImage: (o.restaurantImage) ? `${Config.server.uri}${_C.path.restaurantImagePath}` + (o.restaurantImage) : "",
          restaurantTiming: getDay,
          currentlyAvailable: getDay ? true : false
        }
      })
      return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'total': total, 'data': Restaurant ? (Restaurant) : [] });
    }
    return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': false, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': getAvailableCity ? (getAvailableCity) : [] });
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};


exports.GetCusine = async (req, res) => {
  try {
    let now = new Date();
    let weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let day = weekday[now.getDay()];
    let seconds = now.getSeconds() + (60 * (now.getMinutes() + (60 * now.getHours())));
    let getFormat = moment().startOf('day').seconds(seconds).format('HH:mm');
    //let total     = 0,perPage =_C.pagination.pageSize,page = req.params.page || 1;  

    let getRestaurant = await RestaurantModel.find({
      'cuisineId': { '$in': [objectId(req.params.cuisineId)] },
      'restaurantLocation': { $near: { $geometry: { type: "Point", coordinates: [req.params.longitude, req.params.latitude] }, $maxDistance: 1000 } }
    })
      .populate('cuisineId', 'cuisineName _id')
      .populate('restaurantTimingId', 'hours -_id')
    /*.sort({ 'updatedAt': -1 }).skip((perPage * page) - perPage).limit(perPage)*/.lean().exec();
    let getAvailableCity = await AvailableCityModel.find({}).sort({ 'city': 1 }).select('city -_id').lean().exec();
    console.log("getFood", getRestaurant)

    var filterDoc = [];
    if (getRestaurant && getRestaurant.length > 0) {
      let cuisineSearch = (typeof req.query.cuisineName === "undefined" || req.query.categoryName === "") ? false : true;
      let restaurantNameSearch = (typeof req.query.restaurantName === "undefined" || req.query.restaurantName === "") ? false : true;

      if (cuisineSearch) {
        _.filter(getRestaurant, (el) => {
          _.filter(el.cuisineId, (val) => {
            if (new RegExp('^' + req.query.cuisineName, 'i').test(val.cuisineName)) {
              filterDoc.push(el);
            }
          })
        })
      }

      else if (restaurantNameSearch) {
        _.filter(getRestaurant, (el) => {
          if (new RegExp('^' + req.query.restaurantName, 'i').test(el.restaurantName)) {
            filterDoc.push(el);
          }
        })
      }

      else if (!cuisineSearch && !restaurantNameSearch) {
        filterDoc = getRestaurant;
      }
      total = filterDoc.length;
      let Restaurant = _.map(filterDoc, function (o) {
        let weekDay = (day == 'monday') ? o.restaurantTimingId.hours.monday : (day == 'tuesday') ? o.restaurantTimingId.hours.tuesday : (day == 'wednesday') ? o.restaurantTimingId.hours.wednesday : (day == 'thursday') ? o.restaurantTimingId.hours.thursday : (day == 'friday') ? o.restaurantTimingId.hours.friday : (day == 'saturday') ? o.restaurantTimingId.hours.saturday : o.restaurantTimingId.hours.sunday;

        let getDay = _.map(weekDay, function (t) {
          if ((t.opening) <= seconds && (t.closing) >= seconds) {
            return {
              openingLabel: t.openingLabel,
              closingLabel: t.closingLabel
            }
          }
          else {
            return {
              openingLabel: 'closed',
              openingAt: t.openingLabel
            }
          }
          return getDay;
        })
        return {
          _id: o._id,
          restaurantName: o.restaurantName,
          cuisineName: (o.cuisineId) ? o.cuisineId : "",
          offer: (o.offer) ? (o.offer) + "%" : "",
          rating: (o.rating) ? o.rating : "",
          deliveryTimeLabel: (o.deliveryTimeLabel) ? o.deliveryTimeLabel : "",
          couponCode: (o.couponCode) ? o.couponCode : "",
          costForTwo: (o.costForTwo) ? o.costForTwo : "",
          addtionalNote: (o.addtionalNote) ? (o.addtionalNote) : "",
          restaurantImage: (o.restaurantImage) ? `${Config.server.uri}${_C.path.restaurantImagePath}` + (o.restaurantImage) : "",
          restaurantTiming: getDay,
          currentlyAvailable: getDay ? true : false
        }
      })
      return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'total': total, 'data': Restaurant ? (Restaurant) : [] });
    }
    return res.status(HttpStatus.OK).json({ 'success': true, 'seriviceAvailability': false, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': getAvailableCity ? (getAvailableCity) : [] });
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'message': (err.errmsg) ? (err.errmsg) : err });
  }
};


exports.GetFoodItem = async (req, res) => {
  try {
    let now = new Date();
    let seconds = (now.getMinutes() + (60 * now.getHours()));
console.log("seconds",seconds);
    let getFood = await RestaurantMenuModel.aggregate([
      { "$match": { "restaurantId": objectId(req.params.restaurantId) } },
      {
        "$lookup": {
          "from": "restaurant",
          "localField": "restaurantId",
          "foreignField": "_id",
          "as": "restaurantInfo"
        }
      },
      { "$unwind": "$restaurantInfo" },

      {
        "$lookup": {
          "from": "cuisine",
          "let": { "cuisineId": "$restaurantInfo.cuisineId" },
          "pipeline": [
            {
              "$match": {
                "$expr": { "$in": ["$_id", "$$cuisineId"] },
              }
            },
            { "$project": { "cuisineName": 1, '_id': 0 } }
          ],
          "as": "cuisineName"
        }
      },

      {
        "$project": {
          'categoryName': {
            "$map": {
              "input": "$menus",
              "as": "menu",
              "in": "$$menu.name"
            }
          },
          'tags': "$tag",
          "deliveryTimeLabel": "$restaurantInfo.deliveryTimeLabel",
          "restaurantName": "$restaurantInfo.restaurantName",
          "state": "$restaurantInfo.state",
          "city": "$restaurantInfo.city",
          "faltNumber": "$restaurantInfo.faltNumber",
          "address": "$restaurantInfo.address",
          "restaurantImage": { "$concat": [Config.server.uri + _C.path.restaurantImagePath, "", "$restaurantInfo.restaurantImage"] },
          "fssaiNumber": { "$ifNull": ["$restaurantInfo.fssaiNumber", ''] },
          "itemDetails": 1,
          'restaurantId': 1,
          'category': "$menus",
          "cuisineName": "$cuisineName"
        }
      },
      { "$unwind": "$itemDetails" },
      { "$unwind": "$itemDetails.tag" },
      {
        "$project": {
          'restaurantId': 1,
          'categoryName': 1,
          'tags': 1,
          "deliveryTimeLabel": 1,
          "restaurantName": 1,
          'category': 1,
          "itemDetails": {
            'price': { $ifNull: ["$itemDetails.price", ''] },
            'isVeg': { $ifNull: ["$itemDetails.isVeg", ''] },
            'description': { $ifNull: ["$itemDetails.description", ''] },
            //'itemStatus': { $ifNull: ["$itemDetails.itemStatus", ''] },
            'availableStatus':{ $and: [ { $lte: [ "$itemDetails.availableFrom", seconds ] }, { $gte: [ "$itemDetails.availableTo", seconds ] } ] },
            'itemImage': { $ifNull: [{ "$concat": [Config.server.uri + _C.path.foodItemImagePath, "", "$itemDetails.itemImage"] }, ''] },
            'tag': 1,
            'size':1,
            'foodId': 1,
            'name': 1,
            'status': 1,
            'addOns': 1,
            'packagingCharges': 1,
          },
          "state": 1,
          "city": 1,
          "faltNumber": 1,
          "address": 1,
          "restaurantImage": 1,
          "fssaiNumber": 1,
          "cuisineName": 1
        }
      },
      {
        $sort: { 'itemDetails.tag.tagName': -1 }
      },
      {
        $sort: { 'tags.tagName': -1 }
      },
      {
        "$group": {
          "_id": "$itemDetails.tag",
          //"menuId"            : "$itemDetails.tag.menuId",
          "id": { "$first": "$_id" },
          "itemDetails": { "$push": "$itemDetails" },
          "restaurantId": { "$first": "$restaurantId" },
          "categoryName": { "$first": "$categoryName" },
          "deliveryTimeLabel": { "$first": "$deliveryTimeLabel" },
          "restaurantName": { "$first": "$restaurantName" },
          "tags": { "$first": "$tags" },
          "category": { "$first": "$category" },
          "state": { "$first": "$state" },
          "city": { "$first": "$city" },
          "faltNumber": { "$first": "$faltNumber" },
          "address": { "$first": "$address" },
          "restaurantImage": { "$first": "$restaurantImage" },
          "fssaiNumber": { "$first": "$fssaiNumber" },
          "cuisineName": { "$first": "$cuisineName" },
        }
      },
      {
        "$group": {
          "_id": "$id",
          "FoodItems": { "$push": { "tag": "$_id", "items": "$itemDetails" } },
          "restaurantId": { "$first": "$restaurantId" },
          "categoryName": { "$first": "$categoryName" },
          "tags": { "$first": "$tags" },
          "category": { "$first": "$category" },
          "deliveryTimeLabel": { "$first": "$deliveryTimeLabel" },
          "restaurantName": { "$first": "$restaurantName" },
          "state": { "$first": "$state" },
          "city": { "$first": "$city" },
          "faltNumber": { "$first": "$faltNumber" },
          "address": { "$first": "$address" },
          "restaurantImage": { "$first": "$restaurantImage" },
          "fssaiNumber": { "$first": "$fssaiNumber" },
          "cuisineName": { "$first": "$cuisineName" },
        }
      }
    ])

    // var obj ={}     
    // getFood.map((el)=>{    
    //   obj['_id'] = el.id; 
    //   obj['restaurantId'] = el.restaurantId;           
    //   obj['deliveryTimeLabel'] = el.deliveryTimeLabel;
    //   obj['restaurantName'] = el.restaurantName;
    //   obj['categoryName'] = el.categoryName;
    //   obj['tags'] = el.tags;
    //   obj[el._id] =  el.itemDetails;

    // })
    return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': getFood[0] });
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__(err.errmsg) ? req.i18n.__(err.errmsg) : err });
  }
};

exports.getMenu = async (req, res) => {

  try {

    let getFood = await FoodItemModel.aggregate([
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
      /*{
        '$unwind': {
              'path': '$itemDetails.size', 
              'preserveNullAndEmptyArrays': true
            }
          },*/
      {
        '$project': {
          "_id": 1,
          "foodId": '$itemDetails.foodId',
          "name": "$itemDetails.name",
          "restaurantId": 1,
          "description": '$itemDetails.description',
          "isPackage": '$itemDetails.isPackage',
          "additionalCharges": "$itemDetails.packagingCharges",
          "addOns": "$itemDetails.addOns",
          "tagName": "$itemDetails.tag.tagName",
          "tagId": "$itemDetails.tag.tagId",
          "availableStatus": '$itemDetails.availableStatus',
          "price": '$itemDetails.price',
          "availableStatus": '$itemDetails.availableStatus',
          "size":"$itemDetails.size",
          "itemImage": { $ifNull: [{ "$concat": [Config.server.uri + _C.path.foodItemImagePath, "", "$itemDetails.itemImage"] }, ''] }
          //"quantity":/*'$itemDetails.quantity'*/number(req.body.quantity),              
          //"total":{ $multiply:[ "$itemDetails.price", "$quantity"]}            
        }
      },
      {
        "$match": {
          'foodId': objectId(req.params.foodId),
          'tagId': objectId(req.params.tagId)
        },
      }
    ]);
    console.log("getFood", getFood.length);
    if (getFood && getFood.length > 0) {

      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURTANT_FOOD_ITEM_SUCCESS"), 'data': getFood[0] });

    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURTANT_FOOD_ITEM_NOT_FOUND"), 'data': [] });

  } catch (err) {
    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err, "data": [] });

  }
};
exports.mostPopular = async (req, res) => {
  console.log(req.body);
  try {
    let getFood = await FoodModel;

    let getall = await getFood.find({ 'status': _C.status.adminPanel.active }).select('_id cuisineName cuisineImage sortOrder');
    console.log(getall);
    if (getall && getall.length > 0) {
      var user = _.map(getall, function (o) {
        return {
          _id: o._id,
          cuisineName: o.cuisineName,         
          cuisineImage: (o.cuisineImage) ? o.cuisineImage : ""
        }
      })
      var mostpopular = _.filter(getall, ['sortOrder', 1])
      var get = _.map(mostpopular, function (o) {
        return {
          _id: o._id,
          cuisineName: o.cuisineName,         
          cuisineImage: (o.cuisineImage) ? o.cuisineImage : ""
        }
      })
      console.log("mostpopular", mostpopular);
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': { Recommands: user, MostPopular: get } });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_NOT_FOUND") });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }

}


exports.topCategory = async (req, res) => {
  console.log(req.body);
  try {
    let getFood = await FoodModel;

    let top = await getFood.find({ sortOrder: { '$in': 1 }, status: _C.status.active }).select('_id cuisineName cuisineImage ');

    let more = await getFood.find({ sortOrder: { '$ne': 1 }, status: _C.status.active }).select('_id cuisineName cuisineImage ');
    if (top && top.length > 0) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': { MoreCatrgory: more, TopCategory: top } });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_NOT_FOUND") });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }

}