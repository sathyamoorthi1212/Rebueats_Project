const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    add: {
        body: {
            currencyName: Joi.string().required().error(errors => { return { message: "CURRENCY_NAME_MUST_REQUIRED" } }),
            currencySymbol: Joi.string().required().error(errors => { return { message: "CURRENCY_SYMBOL_MUST_REQUIRED" } })
        },
    },
    update: {
        body: {
            currencyName: Joi.string().required().error(errors => { return { message: "CURRENCY_NAME_MUST_REQUIRED" } }),
            currencySymbol: Joi.string().required().error(errors => { return { message: "CURRENCY_SYMBOL_MUST_REQUIRED" } })
        }
    },
    changeStatus: {
        body: {
            status: Joi.number().required().error(errors => {
                return {
                    message:
                        "STATUS_MUST_REQUIRED"
                }
            })
        }
    },
};