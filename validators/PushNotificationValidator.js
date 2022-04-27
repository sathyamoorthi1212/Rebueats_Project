const Joi = require('joi');

exports.validation = {
    add: {
        body: {
            message: Joi.string().required().error(errors => { return { message: "MESSAGE_MUST_REQUIRED" } }),            
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),            
            userType: Joi.number().required().error(errors => { return { message: "USER_TYPE_MUST_REQUIRED" } })
        }
    },
    update: {
        body: {
            message: Joi.string().required().error(errors => { return { message: "MESSAGE_MUST_REQUIRED" } }),            
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),            
            userType: Joi.number().required().error(errors => { return { message: "USER_TYPE_MUST_REQUIRED" } })
        }
    },
};