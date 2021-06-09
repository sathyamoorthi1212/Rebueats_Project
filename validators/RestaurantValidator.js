const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const validator = require("validator");
const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === 'object' && Object.keys(value).length === 0) ||
  (typeof value === 'string' && value.trim().length === 0);

// exports.validation = {
//   add:{
//         body:{
//           restaurantName : Joi.string().required().error(errors =>{return {message: "RESTAURANT_NAME_MUST_REQUIRED"}}),
//           itemName       : Joi.string().required().error(errors =>{return {message: "ITEM_NAME_MUST_REQUIRED"}}),
//           email          : Joi.string().required().error(errors =>{return {message: "EMAIL_REQUIRED"}}),
//           mobile         : Joi.string().required().error(errors =>{return {message: "MOBILE_REQUIRED"}}),
//           rating         : Joi.number().required().error(errors =>{return {message: "RATING_MUST_REQUIRED"}}),
//           latitude       : Joi.number().precision(8).error(errors =>{return {message: "INVALID_PICKUP_LATITUDE"}}),
//           longitude      : Joi.number().precision(8).error(errors =>{return {message: "INVALID_PICKUP_LONGITUDE"}}),          
//         },
//         /*params:{
//           latitude       : Joi.number().precision(8).required().error(errors =>{return {message: "INVALID_PICKUP_LATITUDE"}}),
//           longitude      : Joi.number().precision(8).required().error(errors =>{return {message: "INVALID_PICKUP_LONGITUDE"}}),

//         }*/    
//   },
//   /*update:{
//         body:{
//           categoryName : Joi.string().required().error(errors =>{return {message: "CUISINE_NAME_MUST_REQUIRED"}})

//         }
//   },*/


// };

exports.restaurantAdd = function (data) {
  let errors = {};
  data.restaurantName = !isEmpty(data.restaurantName) ? data.restaurantName : "";
  //data.itemName       = !isEmpty(data.itemName) ? data.itemName : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.mobile = !isEmpty(data.mobile) ? data.mobile : "";
  // data.rating         = !isEmpty(data.rating) ? data.rating : "";  


  if (!validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }
  if (validator.isEmpty(data.restaurantName)) {
    errors.restaurantName = "Restaurant name field is required";
  }
  // if (validator.isEmpty(data.itemName)) {
  //   errors.itemName = "Item name field is required";
  // }

  if (validator.isEmpty(data.mobile)) {
    errors.mobile = "mobile number field is required";
  }

  // if (validator.isEmpty(data.rating)) {
  //   errors.rating = "Rating field is required";
  // }  
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

exports.restaurantFoodItem = {
  tags: {
    body: {
      tags: Joi.string().required().error(errors => { return { message: "RESTAURANT_TAG_NAME_MUST_REQUIRED" } }),
    },
  },
  menu: {
    body: {
      menuName: Joi.string().required().error(errors => { return { message: "RESTAURANT_MENU_NAME_MUST_REQUIRED" } }),
    }
  },
  update: {
    body: {
      name: Joi.string().required().error(errors => { return { message: "RESTAURANT_MENU_NAME_MUST_REQUIRED" } }),
      tags: Joi.string().required().error(errors => { return { message: "RESTAURANT_TAG_NAME_MUST_REQUIRED" } }),
    }
  }
};

exports.restaurantItem = function (data) {
  let errors = {};
  data.name = !isEmpty(data.name) ? data.name : "";
  data.quantity = !isEmpty(data.quantity) ? data.quantity : "";
  data.price = !isEmpty(data.price) ? data.price : "";
  // data.tag = !isEmpty(data.tag) ? data.tag : "";
  data.tag = JSON.parse(data.tag);
  if (data.tag.length == 0) {
    errors.tag = "Tag field is required";
  }
  else {
    for (let i = 0; i < data.tag.length; i++) {
      if (isEmpty(data.tag[i].tagName) || isEmpty(data.tag[i].tagId)) {
        errors.tag = "Tag field is required";
        break;
      }
    }
  }

  if (validator.isEmpty(data.name)) {
    errors.name = "Food name is required";
  }
  if (validator.isEmpty(data.quantity)) {
    errors.quantity = "Quantity field is required";
  }
  if (validator.isEmpty(data.price)) {
    errors.price = "Price field is required";
  }
  // if (validator.isEmpty(data.tag)) {
  //   errors.tag = "tag field is required";
  // }
  console.log("data", data)
  return {
    errors,
    isValid: isEmpty(errors)
  }
}