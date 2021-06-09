const validator = require("validator");
const isEmpty = value =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0);

exports.restaurantTimeValidator = (req, res, next) => {
    var errors = {};
    if (req.body.isMonday) {
        var mondaySize = req.body.monday.length;
        var monday = req.body.monday;
        for (let i = 0; i < mondaySize; i++) {
            let openTime = !isEmpty(monday[i].opening) ? monday[i].opening.toString() : "";
            let closeTime = !isEmpty(monday[i].closing) ? monday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.monday = "Monday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.monday = "Monday close time are requied";
            }
            if (!(monday[i].opening < monday[i].closing)) {
                errors.monday = "Monday open and close time are invalid";
            }
            if (i != 0 && !(monday[i - 1].closing < monday[i].opening)) {
                errors.monday = "Monday open and close time are invalid";
            }
            monday[i].openingLabel = converMinToTimeFormat(monday[i].opening);
            monday[i].closingLabel = converMinToTimeFormat(monday[i].closing);
        }
        req.body.monday = monday;
    }

    if (req.body.isTuesday) {
        var tuesdaySize = req.body.tuesday.length;
        var tuesday = req.body.tuesday;
        for (let i = 0; i < tuesdaySize; i++) {
            let openTime = !isEmpty(tuesday[i].opening) ? tuesday[i].opening.toString() : "";
            let closeTime = !isEmpty(tuesday[i].closing) ? tuesday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.tuesday = "Tuesday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.tuesday = "Tuesday close time are requied";
            }
            if (tuesday[i].opening > tuesday[i].closing) {
                errors.tuesday = "Tuesday open and close time are invalid";
            }
            if (i != 0 && !(tuesday[i - 1].closing < tuesday[i].opening)) {
                errors.tuesday = "Tuesday open and close time are invalid";
            }
            tuesday[i].openingLabel = converMinToTimeFormat(tuesday[i].opening);
            tuesday[i].closingLabel = converMinToTimeFormat(tuesday[i].closing);
        }
        req.body.tuesday = tuesday;
    }

    if (req.body.isWednesday) {
        var wednesdaySize = req.body.wednesday.length;
        var wednesday = req.body.wednesday;
        for (let i = 0; i < wednesdaySize; i++) {
            let openTime = !isEmpty(wednesday[i].opening) ? wednesday[i].opening.toString() : "";
            let closeTime = !isEmpty(wednesday[i].closing) ? wednesday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.wednesday = "Wednesday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.wednesday = "Wednesday close time are requied";
            }
            if (wednesday[i].opening > wednesday[i].closing) {
                errors.wednesday = "Wednesday open and close time are invalid";
            }
            if (i != 0 && !(wednesday[i - 1].closing < wednesday[i].opening)) {
                errors.wednesday = "Wednesday open and close time are invalid";
            }
            wednesday[i].openingLabel = converMinToTimeFormat(wednesday[i].opening);
            wednesday[i].closingLabel = converMinToTimeFormat(wednesday[i].closing);
        }
        req.body.wednesday = wednesday;
    }

    if (req.body.isThursday) {
        var thursdaySize = req.body.thursday.length;
        var thursday = req.body.thursday;
        for (let i = 0; i < thursdaySize; i++) {
            let openTime = !isEmpty(thursday[i].opening) ? thursday[i].opening.toString() : "";
            let closeTime = !isEmpty(thursday[i].closing) ? thursday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.thursday = "Thursday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.thursday = "Thursday close time are requied";
            }
            if (thursday[i].opening > thursday[i].closing) {
                errors.thursday = "Thursday open and close time are invalid";
            }
            if (i != 0 && !(thursday[i - 1].closing < thursday[i].opening)) {
                errors.thursday = "Thursday open and close time are invalid";
            }
            thursday[i].openingLabel = converMinToTimeFormat(thursday[i].opening);
            thursday[i].closingLabel = converMinToTimeFormat(thursday[i].closing);
        }
        req.body.thursday = thursday;
    }

    if (req.body.isFriday) {
        var fridaySize = req.body.friday.length;
        var friday = req.body.friday;
        for (let i = 0; i < fridaySize; i++) {
            let openTime = !isEmpty(friday[i].opening) ? friday[i].opening.toString() : "";
            let closeTime = !isEmpty(friday[i].closing) ? friday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.friday = "Friday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.friday = "friday close time are requied";
            }
            if (friday[i].opening > friday[i].closing) {
                errors.friday = "Friday open and close time are invalid";
            }
            if (i != 0 && !(friday[i - 1].closing < friday[i].opening)) {
                errors.friday = "Friday open and close time are invalid";
            }
            friday[i].openingLabel = converMinToTimeFormat(thursday[i].opening);
            friday[i].closingLabel = converMinToTimeFormat(thursday[i].closing);
        }
        req.body.friday = friday;
    }

    if (req.body.isSaturday) {
        var saturdaySize = req.body.saturday.length;
        var saturday = req.body.saturday;
        for (let i = 0; i < saturdaySize; i++) {
            let openTime = !isEmpty(saturday[i].opening) ? saturday[i].opening.toString() : "";
            let closeTime = !isEmpty(saturday[i].closing) ? saturday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.saturday = "Saturday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.saturday = "Saturday close time are requied";
            }
            if (saturday[i].opening > saturday[i].closing) {
                errors.saturday = "Saturday open and close time are invalid";
            }
            if (i != 0 && !(saturday[i - 1].closing < saturday[i].opening)) {
                errors.saturday = "Saturday open and close time are invalid";
            }
            saturday[i].openingLabel = converMinToTimeFormat(saturday[i].opening);
            saturday[i].closingLabel = converMinToTimeFormat(saturday[i].closing);
        }
        req.body.saturday = saturday;
    }

    if (req.body.isSunday) {
        var sundaySize = req.body.sunday.length;
        var sunday = req.body.sunday;
        for (let i = 0; i < sundaySize; i++) {
            let openTime = !isEmpty(sunday[i].opening) ? sunday[i].opening.toString() : "";
            let closeTime = !isEmpty(sunday[i].closing) ? sunday[i].closing.toString() : "";

            if (validator.isEmpty(openTime)) {
                errors.sunday = "Sunday open time are requied";
            }
            if (validator.isEmpty(closeTime)) {
                errors.sunday = "Sunday close time are requied";
            }
            if (sunday[i].opening > sunday[i].closing) {
                errors.sunday = "Sunday open and close time are invalid";
            }
            if (i != 0 && !(sunday[i - 1].closing < sunday[i].opening)) {
                errors.sunday = "Sunday open and close time are invalid";
            }
            sunday[i].openingLabel = converMinToTimeFormat(sunday[i].opening);
            sunday[i].closingLabel = converMinToTimeFormat(sunday[i].closing);
        }
        req.body.sunday = sunday;
    }

    if (!isEmpty(errors)) {
        return res.status(400).json(errors);
    }
    next();
}


function converMinToTimeFormat(i) {
    var timeFormat = "AM";
    var hours = i / 60;
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    if (rhours > 12) {
        rhours = rhours - 12;
        timeFormat = 'PM';
    }
    rhours = rhours < 10 ? '0' + rhours : rhours;
    rminutes =
        rminutes === 0
            ? '00' + ' ' + timeFormat
            : rminutes < 10
                ? '0' + rminutes + ' ' + timeFormat
                : rminutes + ' ' + timeFormat;
    var time = rhours + ':' + rminutes;
    return time;
}