const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    add: {
        body: {
            cmsTitle: Joi.string().required().error(errors => { return { message: "CMS_TITLE_MUST_REQUIRED" } }),
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),
            cmsType: Joi.number().required().error(errors => { return { message: "CMS_TYPE_MUST_REQUIRED" } })
        }
    },
    update: {
        body: {
            cmsTitle: Joi.string().required().error(errors => { return { message: "CMS_TITLE_MUST_REQUIRED" } }),
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),
            cmsType: Joi.number().required().error(errors => { return { message: "CMS_TYPE_MUST_REQUIRED" } })
        }
    }
};