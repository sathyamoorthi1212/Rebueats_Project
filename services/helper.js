const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const Config = require('config');
const _C = require('../config/constants');
const _ = require('lodash');
const twilio = require('twilio');
const moment = require('moment');


module.exports = {
    compareHash: function (hashValue, plainValue) {
        return bcrypt.compareSync(plainValue, hashValue)
        // return Bcrypt.compareSync(JSON.stringify(reqest_password), user_password);
    },
    generateHash: function (value) {
        return bcrypt.hashSync(value, bcrypt.genSaltSync(8), null)
        // return Bcrypt.compareSync(JSON.stringify(reqest_password), user_password);
    },
    sendMessage: function (data) {
        return new Promise(function (resolve, reject) {
            try {
                let accountSid = Config.SmsAccountId; // Your Account SID from www.twilio.com/console
                let authToken = Config.SmsAccountToken; // Your Auth Token from www.twilio.com/console
                if (accountSid && authToken) {
                    let client = new twilio(accountSid, authToken);
                    client.messages.create({
                        body: ((data.type == 1) ? Config.SmsContent : (data.type == 2) ? Config.SmsPassword : (data.type == 3) ? Config.SmsRegister : '') + data.replacementContent, // Text this number
                        from: Config.SmsClientMobie // From a valid Twilio number
                    })
                        .then((message) => console.log(message.sid))
                        .catch((err) => console.log(err));
                    //callback(true);
                }
            } catch (_err) {
                console.log(chalk_error(_err));
            }
        })
    },
    dayStartUTC: function (dateTime) {
        return moment(new Date(dateTime).getTime()).utc().startOf('day').format();
    },
    addTime: function (dateTime, value, type, format) {
        let date = moment(dateTime).add(value, type);
        return date.format(format);
    },
    round: function(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
}
