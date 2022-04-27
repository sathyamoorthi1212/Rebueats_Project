const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');

function getImage(v) {
    console.log("v", v)
    if (v) {
        return `${Config.server.uri}${_C.path.userImagePath}${v}`;
        // return `${server_info.uri}${_C.path.folder.user_image_path}${v}`;
    } else {
        return null;
    }
}

function toLatLong(v) {
    if (v) {
        return { latitude: v[1], longitude: v[0] };
    }
}

const DriverSchema = new Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, get: getImage },
    email: { type: String, /* unique: true, */ required: true },
    mobile: { type: String, unique: true, required: true },
    documents: { type: Array },
    countryCode: { type: String, default: '+91' },
    documentVerification: { type: Boolean, default: false },
    otpVerification: { type: Boolean, default: false },
    status: {
        type: Number,
        enum: [_C.status.driver.active, _C.status.driver.inactive, _C.status.driver.online, _C.status.driver.offline, _C.status.driver.deleted],
        default: _C.status.driver.active,
        required: true
    },
    verificationCode: { type: Number, default: 0 },
    driverLocation: {
        type: { type: String, required: true, enum: 'Point', default: 'Point' },
        coordinates: { type: [Number], required: true, default: [0, 0], get: toLatLong }
    },

},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'driver'
    });

DriverSchema.methods.getDriver = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let driver = await driverModel.find(data.query, data.fields).limit(1);
            console.log("SSSSSsss", driver[0].status);
            if (driver.length === 0) {

                return reject({ errmsg: 'INVALID_DRIVER' });

            } else if (driver[0].status != _C.status.driver.online) {

                return reject({ errmsg: 'DRIVER_OFFLINE' });
            }
            /*else if ( driver[ 0 ].document_verification === _C.status.otp_verify.verified ) {
                let error = { is_invalid: true, message: 'DRIVER_NOT_VERIFIED' };
                return reject( {errmsg: 'DRIVER_NOT_VERIFIED'});
            } */
            else {
                return resolve(driver[0]);
            }
        } catch (err) {
            return reject(err);
        }
    });
}

DriverSchema.methods.update_driver_location = function(data) {
    return new Promise(async function(resolve, reject) {
        driverModel.findOneAndUpdate({ '_id': data.deliveryboyid }, { 'location.coordinates': [data.longitude, data.latitude] }, { fields: { 'location.coordinates': 1 }, 'new': true }, function(_err, _location) {
            if (_err || !_location) {
                var error = (_err && _err.message) ? _err.message : { message: 'Invalid driver' };
                return reject(error);
            } else {
                return resolve(_location);
            }
        });
    });
}


DriverSchema.methods.getDriverDistance = function (latitude, longitude, distanceMetre) {
    return new Promise(async function (resolve, reject) {
        try {

            if (latitude && longitude) {
                var driverList = await driverModel.find({
                    driverLocation:
                    {
                        $near:
                        {
                            $geometry: { type: "Point", coordinates: [longitude, latitude] },
                            $maxDistance: Number(distanceMetre)
                        }
                    }
                });
            }

            return resolve(driverList);

        } catch (_err) {
            return reject(_err);
        }
    });
}

DriverSchema.index({ driverLocation: '2dsphere' });
let driverModel = mongoose.model('Driver', DriverSchema);
module.exports = driverModel;
