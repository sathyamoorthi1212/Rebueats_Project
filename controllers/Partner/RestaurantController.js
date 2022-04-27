const lodash = require('lodash');
const objectId = require('mongoose').Types.ObjectId;
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');

//function
const HashService = require('../../services/helper');
const _C = require('../../config/constants');
const HelperFunc = require('../Admin/Function');

//model
const RestaurantTimingModel = require('../../models/RestaurantTiming');
const RestaurantModel = require('../../models/Restaurant')
const restaurantFoodModel = require('../../models/RestaurantMenu');

//validation
const RestaurantValidator = require('../../validators/RestaurantValidator');


/**  
 * ADD or UPDATE Restaurant Timing
 * URL : /api/admin/restaurant/timing
 * METHOD : POST
 * BODY : sunday,monday,tuesday,wednesday,thursday,friday,saturday
 * PARAMS : restaurantId
*/

const multer = require('multer');
const path = require('path');

/** 
 * Add Cuisine
 * url : /api/admin/cuisine/add
 * method : POST
 * author : Sathyamoorthi.R 
 * body : restaurantImage,deliveryTime, longitude, latitude,restaurantName,email,mobile,rating,itemName
*/
exports.add = async (req, res) => {
    console.log("request body", req.body);
    req.body.cuisineId = JSON.parse(req.body.cuisineId)
    try {
        const { errors, isValid } = RestaurantValidator.restaurantAdd(req.body);
        if (!isValid) {
            throw { "error": errors }
        }
        let newDoc = new RestaurantModel(req.body);
        newDoc.deliveryTimeLabel = Math.round(((req.body.deliveryTime) / 24), 0) + " " + "min";
        newDoc.restaurantLocation = {
            type: 'Point',
            coordinates: [
                toRound(req.body.longitude),
                toRound(req.body.latitude)
            ]
        };
        var restaurantImage = lodash.filter(req.files, ['fieldname', 'restaurantImage']);
        newDoc.restaurantImage = (restaurantImage.length === 0) ? "" : restaurantImage[0].filename;

        let checkUnique = await RestaurantModel.find({ 'restaurantName': req.body.restaurantName });
        if (checkUnique && checkUnique.length > 0) {
            throw { errmsg: "RESTAURANT_UNIQUE_ERROR" }
        } else {
            newDoc = await newDoc.save();
        }

        if (newDoc && newDoc.length !== 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_DATA_SUCCESS"), 'data': newDoc });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });

    }
    catch (err) {
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("ADMIN_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

function toRound(val) {
    let valToString = val.toString();
    let splitString = valToString.split('.');
    return splitString.length === 1 ? parseFloat(splitString[0]) : parseFloat(splitString[0] + '.' + splitString[1].slice(0, 8))
}
exports.deleteRestaurant = async (req, res) => {
    console.log("req.body", req.body);
    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteRestaurant = await RestaurantModel.findOneAndUpdate(condition, { 'status': _C.status.adminPanel.deleted }, { new: true });
        console.log("deleteRestaurant", deleteRestaurant);
        if (deleteRestaurant) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_DELETE_SUCCESS") });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_NOT_FOUND") });
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

exports.getAll = async (req, res) => {

    try {
        var pagination = true, condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);

        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }

        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getListCount = await RestaurantModel.find(condition).count();
            res.header('x-total-count', getListCount);
        }

        let getlist = await RestaurantModel.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
      .select('_id restaurantName email mobile restaurantImage restaurantLocation address deliveryTimeLabel deliveryTime freeDelivery deliveryCharge preparingTime ')
      .populate('partnerId', 'firstName lastName _id')
      .populate('cuisineId', '_id cuisineName')
      .exec();
    //console.log("getlist", getlist);
    var fullname = _.map(getlist, function (o) {
      //console.log("getlist", getlist);
      //console.log("fullname", fullname);
      return {
        _id: o._id,
        restaurantName: o.restaurantName,
        email: o.email,
        mobile: o.mobile,
        cuisineId: o.cuisineId,
        address: o.address,
        deliveryTimeLabel: o.deliveryTimeLabel,
        deliveryTime: o.deliveryTime,
        freeDelivery: o.freeDelivery,
        preparingTime: o.preparingTime,
        deliveryCharge: o.deliveryCharge,
        longitude: o.restaurantLocation.coordinates.longitude,
        latitude: o.restaurantLocation.coordinates.latitude,
        restaurantImage: (o.restaurantImage) ? o.restaurantImage : "",
        partnerId: [{ _id: o.partnerId._id, userName: (o.partnerId.firstName) + ' ' + (o.partnerId.lastName) }],
      }
    })
    if (getlist && getlist.length > 0) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': fullname });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_NOT_FOUND") });
  } catch (err) {
    console.log(err)
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }
}

var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "profileImage" || file.fieldname === "profileImage") {
            cb(null, 'assets/images/partner');
        }

        else if (file.fieldname === "restaurantImage" || file.fieldname === "restaurantImage") {
            cb(null, 'assets/images/restaurant');
        }

        else if (file.fieldname === "itemImage" || file.fieldname === "itemImage") {
            cb(null, 'assets/images/food');
        }
    },
    filename: (req, file, cb) => {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            cb(
                null,
                file.fieldname + '-' + Date.now() + path.extname(file.originalname)
            );
        }
    }
});

exports.update = async (req, res) => {
    console.log(req.body)
    try {
        // const { errors, isValid } = partnerValidator.partnerUpdate(req.body);
        // if (!isValid) {
        //   throw { "error": errors }
        // }
        let checkUnique = await RestaurantModel.findOne({ 'email': req.body.email, "_id": { "$ne": req.params.id } }).exec();
        if (checkUnique) {
            throw { "error": { "email": req.i18n.__("USER_EMAIL_UNIQUE_ERROR") } }
        }
        let checkUnique1 = await RestaurantModel.findOne({ 'mobile': req.body.mobile, "_id": { "$ne": req.params.id } }).exec();
        if (checkUnique1) {
            throw { "error": { "mobile": req.i18n.__("USER_MOBILE_UNIQUE_ERROR") } }
        }

        let newDoc = await RestaurantModel.findById({ "_id": req.params.id });
        newDoc.restaurantName = req.body.restaurantName;
        newDoc.address = req.body.address;
        newDoc.email = req.body.email;
        newDoc.cuisineId = JSON.parse(req.body.cuisineId);
        newDoc.userId = req.body.userId;
        newDoc.partnerId = req.body.partnerId;
        newDoc.mobile = req.body.mobile;
        newDoc.longitude = req.body.longitude;
        newDoc.latitude = req.body.latitude;
        newDoc.deliveryTimeLabel = req.body.deliveryTimeLabel;
        newDoc.freeDelivery = req.body.freeDelivery;
        newDoc.deliveryCharge = req.body.deliveryCharge;
        var restaurantImage = lodash.filter(req.files, ['fieldname', 'restaurantImage']);
        newDoc.restaurantImage = (restaurantImage.length === 0) ? newDoc.restaurantImage : restaurantImage[0].filename;

        let updateDoc = await newDoc.save();

        if (updateDoc && updateDoc.length !== 0) {
            let userDetails = {
                _id: updateDoc._id,
                restaurantName: updateDoc.restaurantName,
                address: updateDoc.address,
                email: updateDoc.email,
                mobile: updateDoc.mobile,
                cuisineId: updateDoc.cuisineId,
                userId: updateDoc.userId,
                partnerId: updateDoc.partnerId,
                latitude: updateDoc.latitude,
                longitude: updateDoc.longitude,
                deliveryTimeLabel: updateDoc.deliveryTimeLabel,
                freeDelivery: updateDoc.freeDelivery,
                deliveryCharge: updateDoc.deliveryCharge,
                restaurantImage: restaurantImage ? updateDoc.restaurantImage : " "
            }
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("USER_DATA_SUCCESS"), 'data': userDetails });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA"), 'dfa': ddf });
        }
    }
    catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}

var upload = multer({ storage: storage, limits: { fileSize: 500000 } }).any(); // 500000 bytes to 500 Kb

exports.profileUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ "success": false, 'message': err.message })
        }
        else {
            next();
        }

    })
}



exports.updateTiming = async (req, res) => {
    try {
        let updateTiming = await RestaurantTimingModel.findOneAndUpdate({ "restaurantId": req.params.restaurantId }, { 'hours.isSunday': req.body.isSunday, 'hours.sunday': req.body.sunday, 'hours.isMonday': req.body.isMonday, 'hours.monday': req.body.monday, 'hours.isTuesday': req.body.isTuesday, 'hours.tuesday': req.body.tuesday, 'hours.isWednesday': req.body.isWednesday, 'hours.wednesday': req.body.wednesday, 'hours.isThursday': req.body.isThursday, 'hours.thursday': req.body.thursday, 'hours.isFriday': req.body.isFriday, 'hours.friday': req.body.friday, 'hours.isSaturday': req.body.isSaturday, 'hours.saturday': req.body.saturday }, { new: true });
        if (updateTiming && updateTiming.length !== 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("TIMING_DATA_UPDATE_SUCCESS"), 'data': updateTiming });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("TIMING_NOT_FOUND") });
    }
    catch (err) {
        console.log("error", err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}


exports.restaurantTiming = async (req, res) => {
    console.log("timing", req.body);

    try {
        var timingDoc = await RestaurantTimingModel.findOne({ "restaurantId": req.params.restaurantId });
        if (timingDoc) {
            var newDoc = timingDoc;

        }
        else {
            var newDoc = new RestaurantTimingModel();
        }

        newDoc.hours.sunday = req.body.sunday;
        newDoc.hours.isSunday = req.body.isSunday;
        newDoc.hours.monday = req.body.monday;
        newDoc.hours.isMonday = req.body.isMonday;
        newDoc.hours.tuesday = req.body.tuesday;
        newDoc.hours.isTuesday = req.body.isTuesday;
        newDoc.hours.wednesday = req.body.wednesday;
        newDoc.hours.isWednesday = req.body.isWednesday;
        newDoc.hours.thursday = req.body.thursday;
        newDoc.hours.isThursday = req.body.isThursday;
        newDoc.hours.friday = req.body.friday;
        newDoc.hours.isFriday = req.body.isFriday;
        newDoc.hours.saturday = req.body.saturday;
        newDoc.hours.isSaturday = req.body.isSaturday;
        newDoc.restaurantId = req.params.restaurantId;

        let data = await newDoc.save();
        console.log("data", data);
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_TIMING_ADDED_SUCCESS"), 'data': data });
    }
    catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': (err.error) });
    }
}



exports.listRestaurantTiming = async (req, res) => {
    try {

        let list = await RestaurantTimingModel.find({ "restaurantId": req.params.restaurantId }).select('_id hours ');
        var getdata = _.map(list, function (o) {
            //   var week = o.hours.monday
            //   console.log("monday", week)
            //   var date = _.map(week, function (t) {
            //     return  t.openingLabel + ' - ' + t.closingLabel 
            //   }).join(",");
            //   console.log("date", date)
            //   return { monday:date}
            // 
            // console.log("getdata", getdata)

            return {
                Monday: (o.hours.isMonday == true) ? o.hours.monday : " ",
                Tuesday: (o.hours.isTuesday == true) ? o.hours.tuesday : " ",
                Wednesday: (o.hours.isWednesday == true) ? o.hours.wednesday : "",
                Thursday: (o.hours.isThursday == true) ? o.hours.thursday : "",
                Friday: (o.hours.isFriday == true) ? o.hours.friday : "",
                Saturday: (o.hours.isSaturday == true) ? o.hours.saturday : "",
                Sunday: (o.hours.isSunday == true) ? o.hours.sunday : "",
            }
        })
        let show = await RestaurantTimingModel.find({ "restaurantId": req.params.restaurantId }).select('id hours')
        console.log("getdata", getdata)
        let total = list.length;
        if (list && list.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_TIMING_LIST_SUCCESS"), 'data': { show, getdata }, 'total': total });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_TIMING_NOT_FOUND") });
    } catch (err) {
        console.log("error", err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/**  
* add tag name
* url : /api/admin/restaurant/newTag
* method : post
* body : restaurantId,tagName
*/
exports.addRestaurantTag = async (req, res) => {
    try {
        var checkDoc = await restaurantFoodModel.findOne({ "restaurantId": req.params.restaurantId })
        var tags = lodash.forEach(JSON.parse(req.body.tags), function (val) {
            val.tagId = objectId()
            return val;
        })
        console.log(tags)
        if (checkDoc) {
            var newDoc = await restaurantFoodModel.findOneAndUpdate({ "restaurantId": req.params.restaurantId }, { $set: { "tags": tags } }, { new: true })
        }
        else {
            var newDoc = new restaurantFoodModel({
                "restaurantId": req.params.restaurantId,
                "tags": tags
            })
            console.log(newDoc);
            let val = await newDoc.save();
            console.log(val);
        }
        return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("TAG_DATA_SUCCESS"), 'data': newDoc.tags });
    }
    catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': err.toString() });
    }
}

exports.updateRestaurantTag = async (req, res) => {
    try {
        var tags = lodash.map(JSON.parse(req.body.tags), function (val) {
            if (typeof val.tagId == "undefined" || val.tagId == "") {
                val.tagId = objectId()
            }
            else { val.tagId = objectId(val.tagId) }
            return val;
        })
        console.log("tags", tags);
        let tagUpdate = await restaurantFoodModel.findOneAndUpdate({ 'restaurantId': req.params.restaurantId }, { "$set": { 'tags': tags } }, { 'fields': { "tags": 1 }, new: true });
        console.log("tagUpdate", tagUpdate);
        if (tagUpdate && tagUpdate.length !== 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("TAG_DATA_UPDATE_SUCCESS"), 'data': tagUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("TAG_DATA_NOT_FOUND") });
    } catch (err) {
        console.log("error", err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("TAG_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
}

exports.deletetag = async (req, res) => {
    console.log("req.body", req.body);
    try {
        let condition = {
            'restaurantId': req.params.restaurantId, 'tags.tagId': req.params.tagId,
            /* 'tags.status': _C.status.active */
        };
        let deleteTag = await restaurantFoodModel.findOneAndUpdate(condition, { "$set": { 'tags.$.status': _C.status.deleted } }, { 'fields': { "tags": 1 }, new: true });
        console.log("deleteTag", deleteTag);
        if (deleteTag) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("TAG_DELETE_SUCCESS") });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("TAG_NOT_FOUND") });
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};
/**  
 * add tag name
 * url : /api/admin/restaurant/newMenu
 * method : post
 * body : restaurantId,menuName,tags(arrys) -> tagId,tagName
*/
exports.addRestaurantMenu = (req, res) => {
    restaurantFoodModel.findOneAndUpdate({ "restaurantId": req.params.restaurantId }, {
        "$push": {
            "menus": {
                "name": req.body.menuName,
                "menuId": objectId(),
                "tags": req.body.tags
            }
        }
    }, function (err, data) {
        if (err) { return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': err.toString() }); }
        if (data) { return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("MENU_DATA_SUCCESS"), 'data': data.menus }); }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    })
}

exports.updateRestaurantMenu = async (req, res) => {
    console.log("req", req.body)
    try {
        let condition = { 'restaurantId': req.params.restaurantId, 'menus.menuId': req.params.menuId, /*'menus.status': _C.status.active */ }
        console.log("condition", condition);
        let menuUpdate = await restaurantFoodModel.findOneAndUpdate(condition, { "$set": { 'menus.$.name': req.body.name, 'menus.$.tags': JSON.parse(req.body.tags), } }, { 'fields': { "menus": 1 }, new: true });
        console.log("menuUpdate-----------", menuUpdate)
        if (menuUpdate && menuUpdate.length !== 0) {
            var getMenu = menuUpdate.menus;
            console.log("updattag", getMenu)
            var getMenuUpdate = _.filter(getMenu, ['status', 1]);
            console.log("----------------", getMenuUpdate);
            var getMenuone = _.filter(getMenuUpdate, ['menuId', objectId(req.params.menuId)]);
            console.log("---filter", getMenuone);
            if (getMenuone.length !== 0) {
                return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("MENU_DATA_UPDATE_SUCCESS"), 'data': getMenuone });
            }
            else {
                return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("MENU_DATA_NOT_FOUND") });
            }
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("MENU_DATA_NOT_FOUND") });
    } catch (err) {
        console.log("error", err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("MENU_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
}
exports.deleteMenu = async (req, res) => {
    console.log("req.body", req.body);
    try {
        let condition = {
            'restaurantId': req.params.restaurantId, 'menus.menuId': req.params.menuId,
            /* 'menus.status': _C.status.active */
        };
        let deleteMenu = await restaurantFoodModel.findOneAndUpdate(condition, { "$set": { 'menus.$.status': _C.status.deleted } }, { 'fields': { "menus": 1 }, new: true });
        console.log("deleteMenu", deleteMenu);
        if (deleteMenu) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("MENU_DELETE_SUCCESS") });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("MENU_DATA_NOT_FOUND") });
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
/**  
 * add food items
 * url : /api/admin/restaurant/newItem
 * method : post
 * body : restaurantId, name,restaurantImage, description,isVeg,isPackage,quantity,packagingCharges,tag,price,availableFrom,availableTo
*/

exports.addRestaurantItem = (req, res) => {
    console.log("req.body", req.body);
    const { errors, isValid } = RestaurantValidator.restaurantItem(req.body);
    if (!isValid) {
        return res.status(400).json({ "error": errors })
    }
    var itemImage = lodash.filter(req.files, ['fieldname', 'itemImage']);
    var itemImage1 = (itemImage.length === 0) ? "" : itemImage[0].filename;
    var fromLabel = converMinToTimeFormat(req.body.availableFrom);
    var toLabel = converMinToTimeFormat(req.body.availableTo);
    restaurantFoodModel.findOneAndUpdate({ "restaurantId": req.params.restaurantId }, {
        "$push": {
            "itemDetails": {
                "foodId": objectId(),
                "name": req.body.name,
                "multiSize": JSON.parse(req.body.multiSize),
                "size": JSON.parse(req.body.size),
                "itemImage": itemImage1 ? itemImage1 : " ",
                "description": req.body.description,
                "isVeg": req.body.isVeg,
                "isPackage": req.body.isPackage,
                "quantity": req.body.quantity,
                "packagingCharges": (req.body.isPackage || req.body.isPackage == "true") ? req.body.packagingCharges : 0,
                "tag": req.body.tag,
                "price": req.body.price,
                "availableFrom": req.body.availableFrom,
                "availableTo": req.body.availableTo,
                "availableFromLabel": fromLabel,
                "availableToLabel": toLabel
            }
        }
    }
        , function (err, data) {
            if (err) {
                console.log("errooro", err)
                return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'data': err.toString() });
            }
            if (data) { return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_ITEM_DATA_SUCCESS"), 'data': data.itemDetails }); }
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
        })
}

exports.updateRestaurantItem = async (req, res) => {
    console.log("req.body", req.body)
    try {
        var arr = [];
        var itemImage = lodash.filter(req.files, ['fieldname', 'itemImage']);
        console.log(itemImage);
        if (itemImage.length !== 0) { arr.push(itemImage[0].path) }
        var itemImage1 = (itemImage.length === 0) ? "" : itemImage[0].filename;
        console.log("image", itemImage1);
        let condition = { 'restaurantId': req.params.restaurantId, 'itemDetails.foodId': req.params.foodId, /* 'status': _C.status.active */ }
        let itemUpdate = await restaurantFoodModel.findOneAndUpdate(condition, { "$set": { 'itemDetails.$.name': req.body.name, 'itemDetails.$.description': req.body.description, 'itemDetails.$.addtionalNote': req.body.addtionalNote, 'itemDetails.$.isVeg': req.body.isVeg, 'itemDetails.$.isPackage': req.body.isPackage, 'itemDetails.$.quantity': req.body.quantity, 'itemDetails.$.packagingCharges': req.body.packagingCharges, 'itemDetails.$.addOns': req.body.addOns, 'itemDetails.$.tag': JSON.parse(req.body.tag), 'itemDetails.$.multiSize': JSON.parse(req.body.multiSize), 'itemDetails.$.size': JSON.parse(req.body.size), 'itemDetails.$.price': req.body.price, 'itemDetails.$.availableFrom': req.body.availableFrom, 'itemDetails.$.availableTo': req.body.availableTo, 'itemDetails.$.itemImage': itemImage1, } }, { 'fields': { "itemDetails": 1 }, new: true });
        console.log("mnuupdate", itemUpdate);
        var getItem = itemUpdate.itemDetails;
        console.log("updattag", getItem)
        var getItemUpdate = _.filter(getItem, ['status', 1]);
        console.log("menusis", getItemUpdate);
        var getItemone = _.filter(getItemUpdate, ['foodId', objectId(req.params.foodId)]);
        //let tag = await restaurantFoodModel.findOne(condition).select('menus')
        console.log("getItemone", getItemone);
        if (itemUpdate && itemUpdate.length !== 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_ITEM_DATA_UPDATE_SUCCESS"), 'data': getItemone });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_ITEM_DATA_NOT_FOUND") });

    } catch (err) {
        console.log("error", err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("RESTAURANT_ITEM_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

exports.deleteItem = async (req, res) => {
    console.log("req.body", req.body);
    try {
        let condition = {
            'restaurantId': req.params.restaurantId, 'itemDetails.foodId': req.params.foodId,
            'itemDetails.status': _C.status.active
        };
        let deleteItem = await restaurantFoodModel.findOneAndUpdate(condition, { "$set": { 'itemDetails.$.status': _C.status.deleted } }, { 'fields': { "itemDetails": 1 }, new: true });
        // let tag = await restaurantFoodModel.findOne(condition).select('tags')
        console.log("deleteItem", deleteItem);
        if (deleteItem) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("ITEM_DELETE_SUCCESS") });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("ITEM_NOT_FOUND") });
        }
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
/*** 
*Get listRestaurantController
*url api/admin/restaurant/list 
*GET
*/

// exports.listrestaurant = async (req, res) => {
//   console.log(req.body);
//   try {
//     let perPage = _C.pagination.pageSize, page = parseInt(req.params.page);
//     let list = await restaurantFoodModel.find({ 'status': _C.status.adminPanel.active }).skip(            (perPage * page) - perPage).limit(perPage).select('_id tags menus itemDetails').exec();
//     console.log("list display", list);
//     let total = list.length
//     let mapDoc = list.map((el) => {
//       return {
//         '_id': el._id,
//         'tags': el.tags,
//         'menus': el.menus,
//         'itemDetails': el.itemDetails
//       }
//     })
//     if (list && list.length > 0) {
//       return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_LIST_SUCCESS"), 'data': mapDoc, 'total': total });
//     }
//     return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_NOT_FOUND") });
//   } catch (err) {
//     console.log(err);
//     return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
//   }
// };
exports.listRestaurantTag = async (req, res) => {

    try {
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        let list = await restaurantFoodModel.aggregate([
            { "$match": { "restaurantId": objectId(req.params.id) } },
            { "$unwind": "$tags" },
            { "$match": likeQuery },
            {
                "$project": {
                    "tags": 1
                }
            }, { "$match": { "tags.status": _C.status.active } },
            { "$skip": pageQuery.skip },
            { "$limit": pageQuery.take },
        ])
        var total = list.length;
        if (list && list.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_TAG_LIST_SUCCESS"), 'data': list, 'total': total });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_TAG_NOT_FOUND") });
    } catch (err) {
        console.log(err)
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

exports.listRestaurantMenus = async (req, res) => {
    console.log("req.body", req.body);
    try {
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        let getMenus = await restaurantFoodModel.aggregate([
            { "$match": { "restaurantId": objectId(req.params.id) } },
            { "$unwind": "$menus" },
            { "$match": likeQuery },
            {
                "$project": {
                    "menus": 1
                }
            }, { "$match": { "menus.status": _C.status.active } },
            { "$skip": pageQuery.skip },
            { "$limit": pageQuery.take },
        ])

        var total = getMenus.length;

        if (getMenus && getMenus.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_MENUS_LIST_SUCCESS"), 'data': getMenus, 'total': total });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_MENUS_NOT_FOUND") });
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
exports.listRestaurantItems = async (req, res) => {
    console.log(req.body);
    try {
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        let itemDetailsMenus = await restaurantFoodModel.aggregate([
            { "$match": { "restaurantId": objectId(req.params.id) } },
            { "$unwind": "$itemDetails" },
            { "$match": likeQuery },
            {
                "$project": {
                    "itemDetails": 1,
                    "itemImage": { $ifNull: [{ "$concat": [Config.server.uri + _C.path.foodItemImagePath, "", "$itemDetails.itemImage"] }, ''] },
                }
            }, { "$match": { "itemDetails.status": _C.status.active } },
            { "$skip": pageQuery.skip },
            { "$limit": pageQuery.take },
        ])
        let total = itemDetailsMenus.length;
        if (itemDetailsMenus && itemDetailsMenus.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("RESTAURANT_ITEM_LIST_SUCCESS"), 'data': itemDetailsMenus, 'total': total });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("RESTAURANT_ITEM_NOT_FOUND") });
    } catch (err) {
        console.log("error", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};

function converMinToTimeFormat(i) {
    var timeFormat = "AM";
    var hours = i / 60;
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    if (rhours > 12) {
        rhours = rhours - 12;
        timeFormat = 'PM';
    }
    rhours = rhours < 10 ? '0' + rhours : rhours;
    rminutes =
        rminutes === 0
            ? '00' + ' ' + timeFormat
            : rminutes < 10
                ? '0' + rminutes + ' ' + timeFormat
                : rminutes + ' ' + timeFormat;
    var time = rhours + ':' + rminutes;
    return time;
}