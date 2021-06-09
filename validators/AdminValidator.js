const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
  signup: {
    body: {
      name: Joi.string().min(3).max(20).required().error(errors => { return { message: "NAME_MUST_REQUIRED" } }),
      password: Joi.string().min(8).required().error(errors => { return { message: "PASSWORD_REQUIRED" } }),
      email: Joi.string().email().required().error(errors => { return { message: "EMAIL_REQUIRED" } }),
      mobile: Joi.number().required().error(errors => { return { message: "MOBILE_REQUIRED" } }),
      role: Joi.string().required().error(errors => { return { message: "ROLE_REQUIRED" } })
    },

  },
  login: {
    body: {
      email: Joi.string().required().error(errors => { return { message: "USER_NAME_MUST_REQUIRED" } }),
      password: Joi.string().required().error(errors => { return { message: "PASSWORD_REQUIRED" } }),

    }
  },
  changePassword: {
    body: {
      password: Joi.string().required().error(errors => { return { message: "PASSWORD_REQUIRED" } }),
      newPassword: Joi.string().disallow(Joi.ref('password')).min(8).required().error(errors => { return { message: "INVALID_NEW_PASSWORD" } }),
      confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().error(errors => { return { message: "INVALID_CONFIRM_PASSWORD" } })
    }
  }
};






/*exports.CreateAdmin=async (req,res) =>{

      return new Promise(async function(resolve, reject) {

        try{
          let AdminRegisterSchema = Joi.object().keys({
                name    : Joi.string().required().error(new Error(req.i18n.__("NAME_MUST_REQUIRED"))),
                password: Joi.string().required().error(new Error(req.i18n.__("PASSWORD_REQUIRED"))),
                email   : Joi.string().email().required().error(new Error(req.i18n.__("EMAIL_REQUIRED"))),
                mobile  : Joi.number().required().error(new Error(req.i18n.__("MOBILE_REQUIRED"))),
                role    : Joi.string().required().error(new Error(req.i18n.__("ROLE_REQUIRED"))),
            });

          let check_validation=Joi.validate(req.body,AdminRegisterSchema);

          if(check_validation.error){

             return reject({ err: check_validation.error });

          }else{

              resolve(check_validation);

          }
        }catch(err){
          console.log("ddddddddddd",err);
        // throw boom.badRequest(err);
         // errmsg = (err && err.errmsg) ? err.errmsg : ""

            return reject({ err: e.err});

        }
    });
}
*/