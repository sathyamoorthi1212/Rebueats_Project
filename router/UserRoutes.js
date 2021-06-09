const express = require('express');
const passport = require('passport');


const UserController = require('../controllers/User/UserController');
const ContactusController = require('../controllers/User/ContactusController');
const RestaurantRatingController = require('../controllers/User/RestaurantRatingController');
const DriverRatingController = require('../controllers/User/DriverRatingController');
const CuisineController = require('../controllers/User/CuisineController');

const contactusValidator = require('../validators/ContactusValidator');
const restaurantRatingValidator = require('../validators/RestaurantRatingValidator');
const driverRatingValidator = require('../validators/DriverRatingValidator');
const userValidator = require('../validators/UserValidator');

const router = express.Router();
const passportAuth = passport.authenticate("jwt", { session: false });
const validate = require('express-validation');

/*User Account*/
router.route('/login').get(passportAuth, UserController.currentLogin).post(validate(userValidator.validation.login), UserController.login);
router.route('/signup').post(/*validate(userValidator.validation.signup),UserController.profileUpload,*/ UserController.signup);
router.route('/update/:id').put(/*validate(userValidator.validation.update),*/UserController.profileUpload, UserController.update);
router.route('/forgetPassword/:email').post(passportAuth, UserController.forgetPassword);
router.route('/getUsers').get(passportAuth, UserController.getUsers);
router.route('/logout/:id').post(passportAuth, UserController.logout);
router.route('/otp-verification/:id').post(/*passportAuth*/validate(userValidator.validation.otpVerification), UserController.otpVerification);
router.route('/resend-otp/:id').post(/*passportAuth*/UserController.ResendOtp);
router.route('/change-password/:id').post(passportAuth, validate(userValidator.validation.changePassword), UserController.changePassword);

/*Fav Driver and Res*/
router.route('/favouriteRestaurant/userId/:userId/resId/:resId').post(passportAuth, UserController.favouriteRestaurant);

/*Contactus*/
router.route('/contactus/add').post(passportAuth/*,validate(categoryValidator.validation.add)*/, ContactusController.add);
router.route('/getPages').get(ContactusController.getCms);

/*RestaurantRating && DriverRating*/
router.route('/restaurantRating/add/:orderId').post(passportAuth, validate(restaurantRatingValidator.validation.add), RestaurantRatingController.add);
router.route('/restaurantRating/addItemRating/:foodId').post(passportAuth, RestaurantRatingController.addItemRating);
router.route('/driverRating/add/:orderId').post(passportAuth, validate(driverRatingValidator.validation.add), DriverRatingController.add);

/*getCusine*/
router.route('/cuisine/getCuisine/:id?').get(passportAuth, CuisineController.getCuisine);

router.route('/firebase').post(CuisineController.firebase);


module.exports = router;