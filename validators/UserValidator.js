const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);


exports.validation = {
  signup: {
    body: {      
      name: Joi.string().min(3).max(20).required().error(errors =>{return {message: "NAME_MUST_REQUIRED"}}),
      password: Joi.string().min(8).required().error(errors => {return {message: "PASSWORD_REQUIRED"}}),
      email: Joi.string().email().required().error(errors => {return {message: "EMAIL_REQUIRED"}}),
      mobile  : Joi.number().required().error(errors => {return {message: "MOBILE_REQUIRED"}}),
      address : Joi.string().allow(null).empty(""),
      city    : Joi.string().allow(null).empty(""),
      state   : Joi.string().allow(null).empty(""),
      deviceType: Joi.number().required().error(errors => {return {message: "DEVICETYPE_REQUIRED"}}),
      deviceToken: Joi.string().required().error(errors => {return {message: "DEVICE_TOKEN_REQUIRED"}}),
    },

  },
  login:{
    body:{
      username: Joi.string().required().error(errors =>{return {message: "USER_NAME_MUST_REQUIRED"}}),
      password: Joi.string().required().error(errors => {return {message: "PASSWORD_REQUIRED"}}),

    }
  },
  otpVerification:{
    body:{
      verificationCode: Joi.number().required().error(errors =>{return {message: "VERIFICATION_CODE_REQUIRED"}})
    }
  },
  changePassword:{
    body:{
      password: Joi.string().required().error(errors =>{return {message: "PASSWORD_REQUIRED"}}),
      newPassword: Joi.string().disallow(Joi.ref('password')).min(8).required().error(errors =>{return {message: "INVALID_NEW_PASSWORD"}}),             
      confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().error(errors =>{return {message: "INVALID_CONFIRM_PASSWORD"}})
    }
  }
  
};
