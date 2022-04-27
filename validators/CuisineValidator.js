const validator = require("validator");
//const isEmpty = require('./isEmpty');
const isEmpty = value =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0);


module.exports = function validateRegisterInput(data) {
    let errors = {};
    data.cuisineName = !isEmpty(data.cuisineName) ? data.cuisineName : "";

    if (validator.isEmpty(data.cuisineName)) {
        errors.cuisineName = "Cuisine name cannot be blank";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};