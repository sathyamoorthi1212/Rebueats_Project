const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const User = require('../../models/Cuisine');
//const option = require('../../config/options');
const moment = require('moment');

const includeAccessToken = (user) => {
    const payload = {id: user.id, username: user.username};
    let userObject = user.toJSON();
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
    userObject['token'] = token;

    return userObject;
};

class UserController {

    constructor(model) {
        this.model = User;
    }

    // this will find a single record based on username and return it.
    auth(options) {
        return this.model.findOne({mobileNumber: options.mobileNumber})
            .exec()
            .then((user) => {
                console.log("users",user);
                var hashValue=bcrypt.compareSync(plainValue, hashValue);
                console.log("hash value",hashValue);


                if (!user) {
                    return new Error('Invalid login credentials.');
                }

                if (bcrypt.compareSync(options.password, user.password)) {
                    return includeAccessToken(user);
                } else {
                    return new Error('Invalid login credentials.');
                }

            }).catch(error => {
                return error;
            });

    }

    // this will find all the records in database and return it
    index() {
        return this.model.find()
            .sort({'updated_at':-1})
            .exec()
            .then(records => {
                return records;
            })
            .catch(error => {
                return error;
            });
    }

    // this will find a single record based on id and return it.
    single(options) {
        return this.model.findOne({_id: options.id})
            .exec()
            .then(record => {
                return record;
            })
            .catch(error => {
                return error;
            });
    }
    create(data) {
        const record = new this.model(data);
        return record.save()
            .then((user) => {                
                return user.save()
                    .then(updated => {
                        return (updated);
                    })
                    .catch((error) => {
                        return error;
                    });


            })
            .catch((error) => {
                return error;
            });
    }   
}
;

const user_controller = new UserController();
module.exports = user_controller;
