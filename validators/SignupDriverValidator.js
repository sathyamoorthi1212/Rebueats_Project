const validator = require("validator");
//const isEmpty = require('./isEmpty');
const isEmpty = value =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0);


module.exports = function validateRegisterInput(data) {
    let errors = {};
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";

    data.userName = !isEmpty(data.userName) ? data.userName : "";

    data.mobile = !isEmpty(data.mobile) ? data.mobile : "";

    if (!validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }
    if (validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    }


    if (!validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.password = "Password must be at least 6 characters";
    }
    if (validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }

    if (validator.isEmpty(data.userName)) {
        errors.userName = "First name field is required";
    }

    if (validator.isEmpty(data.mobile)) {
        errors.mobile = "mobile number field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};