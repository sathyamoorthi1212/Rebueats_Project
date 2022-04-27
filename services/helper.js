const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const Config = require('config');
const _C = require('../config/constants');
const _ = require('lodash');
const twilio = require('twilio');
const chalk_error = Config.CHALK_ERROR;
const moment = require('moment');
const SettingModel = require('../models/Setting');



module.exports = {
    compareHash: function (hashValue, plainValue) {
        return bcrypt.compareSync(plainValue, hashValue)
        // return Bcrypt.compareSync(JSON.stringify(reqest_password), user_password);
    },
    generateHash: function (value) {
        return bcrypt.hashSync(value, bcrypt.genSaltSync(8), null)
        // return Bcrypt.compareSync(JSON.stringify(reqest_password), user_password);
    },
    sendMessage: function (data, getSMSDetails, smsContent) {
        return new Promise(function (resolve, reject) {
            try {
                let accountSid = getSMSDetails.smsGatewayId; // Your Account SID from www.twilio.com/console                
                let authToken = getSMSDetails.smsGatewayToken; // Your Auth Token from www.twilio.com/console                
                if (accountSid && authToken) {
                    let client = new twilio(accountSid, authToken);
                    client.messages.create({
                        body: smsContent + data.replacementContent,
                        to: data.mobile,// Text this number
                        from: getSMSDetails.smsGatewayNumber // From a valid Twilio number
                    })

                        .then((message) => console.log(message.sid))
                        .catch((err) => console.log(err));
                    //callback(true);
                }
            } catch (_err) {
                console.log("error here", _err);
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
    round: function (value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    },
    getDriverCommission: async function() {
        return new Promise(async function(resolve, reject) {
            try {
                let setting = await SettingModel.find({}, 'siteInfo.driverCommission').limit(1).exec();
                let commission = (setting && setting.length > 0) ? setting[0].siteInfo.driverCommission : 0;
                resolve(commission);
            } catch (err) {
                reject(err);
            }
        })
    }
}
