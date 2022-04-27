const Joi = require('joi');

exports.validation = {
    add: {
        body: {
            emailSubject: Joi.string().required().error(errors => { return { message: "EMAIL_SUBJECT_MUST_REQUIRED" } }),
            emailContent: Joi.string().required().error(errors => { return { message: "EMAIL_CONTENT_MUST_REQUIRED" } }),
            smsContent: Joi.string().required().error(errors => { return { message: "SMS_CONTENT_MUST_REQUIRED" } }),
            pushNotificationContent: Joi.string().required().error(errors => { return { message: "PUSH_NOTIFICATIN_MUST_REQUIRED" } }),
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),
            notificationType: Joi.array().required().error(errors => { return { message: "NOTIFICATION_TYPE_MUST_REQUIRED" } }),
            notificationContentType: Joi.number().required().error(errors => { return { message: "NOTIFICATION_CONTENT_TYPE_MUST_REQUIRED" } })
        }
    },
    update: {
        body: {
            emailSubject: Joi.string().required().error(errors => { return { message: "EMAIL_SUBJECT_MUST_REQUIRED" } }),
            emailContent: Joi.string().required().error(errors => { return { message: "EMAIL_CONTENT_MUST_REQUIRED" } }),
            smsContent: Joi.string().required().error(errors => { return { message: "SMS_CONTENT_MUST_REQUIRED" } }),
            pushNotificationContent: Joi.string().required().error(errors => { return { message: "PUSH_NOTIFICATIN_MUST_REQUIRED" } }),
            appType: Joi.number().required().error(errors => { return { message: "APP_TYPE_MUST_REQUIRED" } }),
            notificationType: Joi.array().required().error(errors => { return { message: "NOTIFICATION_TYPE_MUST_REQUIRED" } }),
            notificationContentType: Joi.number().required().error(errors => { return { message: "NOTIFICATION_CONTENT_TYPE_MUST_REQUIRED" } })
        }
    },
};