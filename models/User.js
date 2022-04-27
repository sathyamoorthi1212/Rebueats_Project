const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config = require('config');
const _C = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;

function getImage(v) {
    console.log("v", v)
    if (v) {
        return `${Config.server.uri}${_C.path.userImagePath}${v}`;
        // return `${server_info.uri}${_C.path.folder.user_image_path}${v}`;
    } else {
        return null;
    }
}

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    password: { type: String, required: true },
    email: { type: String, /*unique: true,*/ required: true },
    mobile: { type: String, /*unique: true,*/ required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    countryCode: { type: String, default: '+91' },
    verificationCode: { type: Number, default: 0 },
    deviceToken: { type: String },
    deviceType: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lastLogin: { type: Date },
    profileImage: { type: String, get: getImage },
    favouriteRestaurant: [{ type: ObjectId, ref: 'Restaurant' }],
    favouriteDriver: [{ type: ObjectId, ref: 'Driver' }],
    otpVerification: { type: Boolean, default: false  },
    status: {
        type: Number,
        enum: [_C.status.user.active, _C.status.user.inactive, _C.status.user.online, _C.status.user.offline, _C.status.user.deleted],
        default: _C.status.user.active,
        required: true
    },

},

    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        versionKey: false,
        collection: 'user'
    });

UserSchema.methods.getUser = async (req, res) => {
    return new Promise(async function (resolve, reject) {
        try {
            let user = await userModel.find(req.cond, req.select).limit(1).exec();
            if (user && user.length > 0) {
                resolve(user[0]);
            } else {
                reject({ errmsg: 'INVALID_USER' });
            }
        } catch (e) {
            console.log(e)
            reject({ errmsg: e.errmsg });
        }
    });
}
let userModel = mongoose.model('User', UserSchema)
module.exports = userModel;