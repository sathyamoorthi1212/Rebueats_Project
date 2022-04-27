const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
    create: {
        body: {
            siteKey: Joi.string().required().error(errors => { return { message: "SITEKEY_MUST_REQUIRED" } })
        }
    },
    updateSMTPSetting: {
        body: {
            smtpHost: Joi.string().required().error(errors => { return { message: "SMTP_HOST_MUST_REQUIRED" } }),
            smtpPort: Joi.number().required().error(errors => { return { message: "SMTP_PORT_MUST_REQUIRED" } }),
            smtpUsername: Joi.string().required().error(errors => { return { message: "SMTP_USER_NAME_MUST_REQUIRED" } }),
            smtpPassword: Joi.string().required().error(errors => { return { message: "SMTP_PASSWORD_MUST_REQUIRED" } }),
            smtpEmail: Joi.string().required().error(errors => { return { message: "SMTP_EMAIL_MUST_REQUIRED" } }),
            smtpName: Joi.string().required().error(errors => { return { message: "SMTP_NAME_MUST_REQUIRED" } }),
        }
    },
    updateSMSSetting: {
        body: {
            smsGatewayId: Joi.string().required().error(errors => { return { message: "SMS_GATEWAY_ID_MUST_REQUIRED" } }),
            smsGatewayToken: Joi.string().required().error(errors => { return { message: "SMS_GATEWAY_TOKEN_MUST_REQUIRED" } }),
            smsGatewayNumber: Joi.string().required().error(errors => { return { message: "SMS_GATEWAY_NUMBER_MUST_REQUIRED" } }),
        }
    },
    // updateApp: {
    //     body: {
    //         siteName: Joi.string().required().error(errors => { return { message: "SITE_NAME_MUST_REQUIRED" } }),
    //         siteTag: Joi.string().required().error(errors => { return { message: "SITE_TAG_MUST_REQUIRED" } }),
    //         siteContactEmail: Joi.string().required().error(errors => { return { message: "SITE_CONTACT_EMAIL_MUST_REQUIRED" } }),
    //         siteContactNumber: Joi.string().required().error(errors => { return { message: "SITE_CONTACT_NUMBER_MUST_REQUIRED" } }),
    //         siteContactAddress: Joi.string().required().error(errors => { return { message: "SITE_CONTACT_ADDRESS_MUST_REQUIRED" } }),
    //         defaultCurrency: Joi.objectId().required().error(errors => { return { message: "CURRENCY_ID_MUST_REQUIRED" } }),
    //     }
    // }
};