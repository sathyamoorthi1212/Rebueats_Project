const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const Config     = require('config');

var jwtOptions = {};
  jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  jwtOptions.secretOrKey = Config.API_SECRET;

const User = require('../models/Admin');

module.exports = passport => passport.use(
  new JwtStrategy(jwtOptions, function(jwt_payload, done) {
    User.findOne({ username: jwt_payload.username }, (err, user) => {
      if (user) {
        return done(null, user);
      }
      return done(null, false).catch(err => {
        console.log(err);
        return done(err, false);
      });
    });
  })
);


