const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
  newOrders:{
        body:{
          pickupLatitude       : Joi.number().precision(8).error(errors =>{return {message: "INVALID_PICKUP_LATITUDE"}}),
          pickupLongitude      : Joi.number().precision(8).error(errors =>{return {message: "INVALID_PICKUP_LONGITUDE"}}),          
        },
  },  
  updateCart:{
        body:{
          quantity       : Joi.number().error(errors =>{return {message: "QUANTITY_MUST_BE_REQUIRED"}}),          
        },
  },
};
