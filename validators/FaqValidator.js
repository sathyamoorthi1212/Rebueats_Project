const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    create: {
        body: {
            faqcategoryId: Joi.objectId().required().error(errors => { return { message: "FAQ_CATEGORY_ID_MUST_REQUIRED" } }),
            question: Joi.string().required().error(errors => { return { message: "QUESTION_MUST_REQUIRED" } }),
            answer: Joi.string().required().error(errors => { return { message: "ANSWER_MUST_REQUIRED" } })
        }
    },
    update: {
        body: {
            faqcategoryId: Joi.objectId().required().error(errors => { return { message: "FAQ_CATEGORY_ID_MUST_REQUIRED" } }),
            question: Joi.string().required().error(errors => { return { message: "QUESTION_MUST_REQUIRED" } }),
            answer: Joi.string().required().error(errors => { return { message: "ANSWER_MUST_REQUIRED" } })
        }
    },
    add: {
        body: {
            faqCategoryName: Joi.string().required().error(errors => { return { message: "FAQ_CATEGORY_NAME_MUST_REQUIRED" } }),
        }
    },
    updateFaqCategory: {
        body: {
            faqCategoryName: Joi.string().required().error(errors => { return { message: "FAQ_CATEGORY_NAME_MUST_REQUIRED" } }),
        }
    }
};