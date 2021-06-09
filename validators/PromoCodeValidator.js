//const Joi = require('joi');
const dateExtension = require('joi-date-extensions');
const Joi = require('joi').extend(dateExtension);
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    add: {
        body: {
            promoName: Joi.string().required().error(errors => { return { message: "PROMO_NAME_MUST_REQUIRED" } }),
            startDate: Joi.date().format('YYYY-MM-DD').error(errors => { return { message: "START_DATE_MUST_REQUIRED_YEAR-MONTH-DATE" } }),
            endDate: Joi.date().format('YYYY-MM-DD').error(errors => { return { message: "END_DATE_MUST_REQUIRED_YEAR-MONTH-DATE" } }),
            expireDate: Joi.date().min('now').required().error(errors => { return { message: "EXPIRE_DATE_MUST_GREATER_TODAY_DATE" } }),
            promoType: Joi.string().required().error(errors => { return { message: "PROMO_TYPE_MUST_REQUIRED" } }),
            promoCode: Joi.string().required().error(errors => { return { message: "PROMO_CODE_MUST_REQUIRED" } }),
        },
    },
    update: {
        body: {
            promoName: Joi.string().required().error(errors => { return { message: "PROMO_NAME_MUST_REQUIRED" } }),
            startDate: Joi.date().format('YYYY-MM-DD').error(errors => { return { message: "START_DATE_MUST_REQUIRED_YEAR-MONTH-DATE" } }),
            endDate: Joi.date().format('YYYY-MM-DD').error(errors => { return { message: "END_DATE_MUST_REQUIRED_YEAR-MONTH-DATE" } }),
            expireDate: Joi.date().min('now').required().error(errors => { return { message: "EXPIRE_DATE_MUST_GREATER_TODAY_DATE" } }),
            promoType: Joi.number().required().error(errors => { return { message: "PROMO_TYPE_MUST_REQUIRED" } }),
            promoCode: Joi.string().required().error(errors => { return { message: "PROMO_CODE_MUST_REQUIRED" } }),
        }
    },

};
