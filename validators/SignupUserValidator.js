/*var ExpressJoi = require('express-joi-validator');
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.signup=async (req,res) =>{

        try{
      
          let productDetailsSchema = Joi.object().keys({
                name: Joi.string().min(3).max(20).required().error(new Error("NAME_MUST_REQUIRED")),
                password: Joi.string().min(8).required().error(new Error("PASSWORD_REQUIRED")),
                email: Joi.string().email().required().error(new Error("EMAIL_REQUIRED")),
                mobile  : Joi.number().required().error(new Error("MOBILE_REQUIRED")),
                address : Joi.string().allow(null).empty(""),
                city    : Joi.string().allow(null).empty(""),
                state   : Joi.string().allow(null).empty(""),
                deviceType: Joi.number().required().error(new Error("DEVICETYPE_REQUIRED")),
                deviceToken: Joi.string().required().error(new Error("DEVICE_TOKEN_REQUIRED")),
            });
          let check_validation=Joi.validate(req.body,productDetailsSchema);
          if(check_validation.error){    
            
             throw { err: check_validation.error.message }

          }else{
              return resolve(check_validation);
          } 
        }catch(e){
          console.log("catch",e.err)
            return reject({ errmsg: req.i18n.__(e.err)});

        }
          
        
}
*/
const validator = require("validator");
//const isEmpty = require('./isEmpty');
const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === 'object' && Object.keys(value).length === 0) ||
  (typeof value === 'string' && value.trim().length === 0);


module.exports.add = function validateRegisterInput(data) {
  let errors = {};
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
  data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
  data.mobile = !isEmpty(data.mobile) ? data.mobile : "";

  if (!validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }


  if (!validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password must be at least 6 characters";
  }
  if (validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  if (validator.isEmpty(data.firstName)) {
    errors.firstName = "First name field is required";
  }
  if (validator.isEmpty(data.lastName)) {
    errors.lastName = "Last name field is required";
  }

  if (validator.isEmpty(data.mobile)) {
    errors.mobile = "mobile number field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};



module.exports.update = function validateRegisterUpdateInput(data) {
  let errors = {};
  data.email = !isEmpty(data.email) ? data.email : "";

  data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
  data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
  data.mobile = !isEmpty(data.mobile) ? data.mobile : "";

  if (!validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }

  if (validator.isEmpty(data.firstName)) {
    errors.firstName = "First name field is required";
  }
  if (validator.isEmpty(data.lastName)) {
    errors.lastName = "Last name field is required";
  }

  if (validator.isEmpty(data.mobile)) {
    errors.mobile = "mobile number field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};