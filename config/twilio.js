'use strict'
const Config = require('config'),
    twilio = require('twilio');
// let chalk_log = Config.CHALK_LOG;
let chalk_error = Config.CHALK_ERROR;

let send_message = async function(setting, input,callback) {
    
    let mobile_number=input.contact_number;
    
    return new Promise(function(resolve, reject) {
        try {
            let accountSid = Config.sms_gateway_id; // Your Account SID from www.twilio.com/console
            let authToken = Config.sms_gateway_token; // Your Auth Token from www.twilio.com/console
            if (accountSid && authToken) {
                let client = new twilio(accountSid, authToken);
                client.messages.create({
                        body: input.content,
                        to: Config.COUNTRY_CODE+mobile_number, // Text this number
                        from: setting.sms_gateway_number // From a valid Twilio number
                    })
                    .then((message) => console.log(message.sid))
                    .catch((err) => console.log(err));
                callback(true);
            }
        } catch (_err) {
            console.log(chalk_error(_err));
        }
    })
}

module.exports = {
    send_message: send_message
}