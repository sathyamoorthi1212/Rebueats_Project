const validator = require("validator");
//const isEmpty = require('./isEmpty');
const isEmpty = value =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0);


module.exports = function validateRegisterInput(data) {
    let errors = {};
    data.siteName = !isEmpty(data.siteName) ? data.siteName : "";
    data.siteTag = !isEmpty(data.siteTag) ? data.siteTag : "";
    data.siteContactEmail = !isEmpty(data.siteContactEmail) ? data.siteContactEmail : "";
    data.siteContactNumber = !isEmpty(data.siteContactNumber) ? data.siteContactNumber : "";
    data.siteContactAddress = !isEmpty(data.siteContactAddress) ? data.siteContactAddress : "";
    data.defaultCurrency = !isEmpty(data.defaultCurrency) ? data.defaultCurrency : "";

    if (validator.isEmpty(data.siteContactAddress)) {
        errors.siteContactAddress = "Site ContactAddress field is required";//SITE_CONTACT_ADDRESS_MUST_REQUIRED
    }

    if (validator.isEmpty(data.defaultCurrency)) {
        errors.defaultCurrency = "Default Currency id is required";//CURRENCY_ID_MUST_REQUIRED
    }

    if (validator.isEmpty(data.siteName)) {
        errors.siteName = "Site Name field is required";//SITE_NAME_MUST_REQUIRED
    }

    if (validator.isEmpty(data.siteTag)) {
        errors.siteTag = "Site Tag field is required";//SITE_TAG_MUST_REQUIRED
    }

    if (validator.isEmpty(data.siteContactEmail)) {
        errors.siteContactEmail = "Site Contact Email field is required";//SITE_CONTACT_EMAIL_MUST_REQUIRED
    }

    if (validator.isEmpty(data.siteContactNumber)) {
        errors.siteContactNumber = "Site Contact Number field is required";//SITE_CONTACT_NUMBER_MUST_REQUIRED
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};