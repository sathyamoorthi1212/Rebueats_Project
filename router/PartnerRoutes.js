const express = require('express');
const passport = require('passport');
const PartnerController = require('../controllers/Partner/PartnerController');
const OrderController = require('../controllers/Partner/OrderController');
const PartnerValidator = require('../validators/UserValidator');
const RestaurantController = require('../controllers/Partner/RestaurantController');
const restaurantTimeValidator = require('../validators/restaurantTimingValidator');
const restaurantValidator = require('../validators/RestaurantValidator');
const router = express.Router();
const passportAuth = passport.authenticate("jwt", { session: false });
const validate = require('express-validation');

/* partner */
router.route('/login').get(passportAuth, PartnerController.currentLogin).post(validate(PartnerValidator.validation.login), PartnerController.login);
router.route('/signup').post(PartnerController.profileUpload, PartnerController.signup);
router.route('/update/:id').put(PartnerController.profileUpload, PartnerController.update);
router.route('/list').get(passportAuth, PartnerController.list);
router.route('/getPartner/:id').get(passportAuth, PartnerController.getpartner);
router.route('/logout/:id').post(passportAuth, PartnerController.logout);
router.route('/forgetPassword/:email').post(/* passportAuth, */ PartnerController.forgetPassword);
router.route('/changePassword/:id').post(passportAuth, validate(PartnerValidator.validation.changePassword), passportAuth, PartnerController.changePassword);
router.route('/delete/:id').post(passportAuth, PartnerController.delete);

/*Restaurant*/
router.route('/restaurant/add').post(passportAuth, RestaurantController.profileUpload, RestaurantController.add);
router.route('/restaurant/update/:id?').put(passportAuth, RestaurantController.profileUpload, RestaurantController.update);
router.route('/restaurant/getAll/:id?').get(passportAuth, RestaurantController.profileUpload, RestaurantController.getAll);
router.route('/restaurant/delete/:id').post(passportAuth, RestaurantController.profileUpload, RestaurantController.deleteRestaurant);
router.route('/restaurant/timing/:restaurantId').post(/* passportAuth, */restaurantTimeValidator.restaurantTimeValidator, RestaurantController.restaurantTiming);
router.route('/restaurant/timing/list/:restaurantId').get(RestaurantController.listRestaurantTiming);
router.route('/restaurant/updateTiming/:restaurantId').put(restaurantTimeValidator.restaurantTimeValidator, RestaurantController.updateTiming);

/*Confirm Order*/
router.route('/order/confirm/:orderId').post(passportAuth, PartnerController.confirmOrder);

/*Restaurant Food items  */
router.route('/restaurant/newTag/:restaurantId').post(passportAuth, validate(restaurantValidator.restaurantFoodItem.tags), RestaurantController.addRestaurantTag);
router.route('/restaurant/updateTag/restaurantId/:restaurantId').put(passportAuth, validate(restaurantValidator.restaurantFoodItem.tags), RestaurantController.updateRestaurantTag);
router.route('/restaurant/deleteTag/tagId/:tagId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deletetag);
router.route('/restaurant/newMenu/:restaurantId').post(passportAuth, validate(restaurantValidator.restaurantFoodItem.menu), RestaurantController.addRestaurantMenu);
router.route('/restaurant/deleteMenu/menuId/:menuId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deleteMenu);
router.route('/restaurant/updateMenu/menuId/:menuId/restaurantId/:restaurantId').put(passportAuth, validate(restaurantValidator.restaurantFoodItem.update), RestaurantController.updateRestaurantMenu);
router.route('/restaurant/updateItem/foodId/:foodId/restaurantId/:restaurantId').put(passportAuth, RestaurantController.profileUpload, RestaurantController.updateRestaurantItem);
router.route('/restaurant/deleteItem/foodId/:foodId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deleteItem);
router.route('/restaurant/listRestaurantTag/:id').get(passportAuth, RestaurantController.listRestaurantTag);
router.route('/restaurant/listRestaurantMenus/:id').get(passportAuth, RestaurantController.listRestaurantMenus);
router.route('/restaurant/listRestaurantItems/:id').get(passportAuth, RestaurantController.listRestaurantItems);
router.route('/restaurant/additem/:restaurantId').post(passportAuth, RestaurantController.profileUpload, RestaurantController.addRestaurantItem);
/*Order Lists */
router.route('/order/listOrder').get(passportAuth, OrderController.listOrder);
router.route('/order/listAcceptedOrder').get(passportAuth, OrderController.listAcceptedOrder);
router.route('/order/getOrder/:id').get(passportAuth, OrderController.getOrder);
router.route('/order/getAccepted/:id').get(passportAuth, OrderController.getAccepted);
router.route('/order/listDeliveryOrder').get(passportAuth, OrderController.listDeliveryOrder);
router.route('/order/getDelivery/:id').get(passportAuth, OrderController.getDelivery);

module.exports = router;