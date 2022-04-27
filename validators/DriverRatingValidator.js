const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    add: {
        body: {
            userId: Joi.objectId().required().error(errors => { return { message: "USER_ID_MUST_REQUIRED" } }),
            restaurantId: Joi.objectId().required().error(errors => { return { message: "RESTAURANT_ID_MUST_REQUIRED" } }),
            //orderId: Joi.objectId().required().error(errors => { return { message: "ORDER_ID_MUST_REQUIRED" } }),
            driverId: Joi.objectId().required().error(errors => { return { message: "DRIVER_ID_MUST_REQUIRED" } }),
            rating: Joi.number().required().error(errors => { return { message: "RATING_MUST_REQUIRED" } })

        },
    }

};
