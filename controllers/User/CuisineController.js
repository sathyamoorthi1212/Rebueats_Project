const UserRoute = require('express').Router();
const CuisineModel = require('../../models/Cuisine');
const Config = require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C = require('../../config/constants');
//var firebase = require('firebase');

//const HelperFunc = require('../../Function');



/** 
 * Get Cuisine
 * url : /api/user/cuisine/getCuisine
 * method : POST
 * author : Sathyamoorthi.R 
 * params : id of Cuisine _id
*/
exports.getCuisine = async (req, res) => {

  try {

    let getCuisine = await CuisineModel.find({ 'status': _C.status.adminPanel.active }).sort({ 'updatedAt': -1 }).select('_id cuisineName ');


    if (getCuisine && getCuisine.length > 0) {
      return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("CUISINE_LIST_SUCCESS"), 'data': getCuisine });
    }
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("CUISINE_LIST_NOT_FOUND") });
  } catch (err) {
    console.log("error", err);
    return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
  }

};


exports.firebase = async (req, res) => {
  console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDdd", req.body.name)
  var datas = req.body;
  var userId = datas._id;
  if (!firebase.apps.length) {
    firebase.initializeApp(Config.firebasekey);
  }



  const date = new Date();

  const firstDayofCurrentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  console.log("ffffffffffffffffffffffffffff", firstDayofCurrentMonth)
  const lastDayofCurrentMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  console.log("ffffffffffffffffffffffffffff", lastDayofCurrentMonth)

  /*var db = firebase.database();
  var ref = db.ref("user"); 
  var requestData = {     
    name : datas.name,
    age  : datas.age
  };
  var id = datas._id.toString(); 
  console.log(id)
  var usersRef = ref.child(id); 

  usersRef.set(requestData,function(snapshot) {
    return res.json({'success':true,'message':'Password Updated Successfully', 'snap' :  snapshot});  
    console.log("addRiderDatatoFb",requestData);
  });  */


  /*GET*/
  var db = firebase.database();
  var ref = db.ref("user")/*.child(12)*/;
  ref.once("value", function (snapshot) {
    console.log("SSSSSSSSSSSSSSs", snapshot)
    res.send([snapshot.val()])
  }, function (errorObject) {
    return res.status(500).json({ 'success': false, 'message': 'Some Error..', 'error': errorObject.code })
  });

  /*Create also using*/
  /*firebase.database().ref('user/' + userId).set({
   name: req.body.name,
   age: req.body.age
 });*/
}  
