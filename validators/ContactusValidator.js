const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
  add:{
        body:{
          contactusName       : Joi.string().required().error(errors =>{return {message: "CONTACTUS_NAME_REQUIRED"}}),
          contactusMobile     : Joi.number().required().error(errors =>{return {message: "CONTACTUS_MOBILE_MUST_REQUIRED"}}),
          contactusEmail      : Joi.number().required().error(errors =>{return {message:"CONTACTUS_EMAIL_MUST_REQUIRED"}})
        },    
  }
   
};
