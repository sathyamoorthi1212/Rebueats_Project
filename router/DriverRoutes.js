const express = require('express');
const passport = require('passport');
const DriverController = require('../controllers/Driver/DriverController');
const driverValidator = require('../validators/DriverValidator');
const DriverAllocationController = require('../controllers/Driver/DriverAllocationController');
const router = express.Router();
const passportAuth = passport.authenticate("jwt", { session: false });
const validate = require('express-validation');

/*Driver Account*/

router.route('/login').get(DriverController.currentLogin).post(validate(passportAuth, driverValidator.validation.login), DriverController.login);
router.route('/signup').post(passportAuth, DriverController.profileUpload, DriverController.signup);
router.route('/update/:id').put(/*validate(userValidator.validation.update),*/DriverController.profileUpload, DriverController.update);
router.route('/getUsers').get(passportAuth, DriverController.getUsers);
router.route('/logout/:id').post(passportAuth, DriverController.logout);
router.route('/otp-verification/:id').post(/*passportAuth*/validate(driverValidator.validation.otpVerification), DriverController.otpVerification);
router.route('/resend-otp/:id').post(/*passportAuth*/DriverController.ResendOtp);
router.route('/changePassword/:id').post(passportAuth, validate(driverValidator.validation.changePassword), passportAuth, DriverController.changePassword);
router.route('/forgetPassword/:email').post(passportAuth, DriverController.forgetPassword);
/*Driver Allocation Routes*/
router.route('/assign/driverId/:driverId/orderId/:orderId').post(passportAuth, DriverAllocationController.assign);
router.route('/autoAssign/driverId/:driverId/orderId/:orderId').post(passportAuth, DriverAllocationController.autoAssign);
router.route('/order/accept/driverId/:driverId/orderId/:orderId').post(passportAuth, DriverAllocationController.orderAccept);
router.route('/order/reject/driverId/:driverId/orderId/:orderId').post(passportAuth, DriverAllocationController.orderReject);
router.route('/order/change-status/:orderId').post(passportAuth, DriverAllocationController.changeOrderStatus);



module.exports = router;