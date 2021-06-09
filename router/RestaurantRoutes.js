const express = require('express');
const passport = require('passport');
const router = express.Router();
const passportAuth = passport.authenticate("jwt", { session: false });
const validate = require('express-validation');
const RestaurantController = require('../controllers/Restaurant/RestaurantController');
const PartnerController = require('../controllers/Admin/PartnerController');
const CartController = require('../controllers/User/CartController');
const ordersValidator = require('../validators/OrdersValidator');
const restaurantValidator = require('../validators/RestaurantValidator');
const OrderController = require('../controllers/User/OrderController');


/*Restaurant*/
router.route('/restaurantMenu/add').post(passportAuth/*,validate(restaurantValidator.validation.add)*/, RestaurantController.addMenu);
router.route('/restaurantTiming/add').post(/*validate(restaurantValidator.validation.add)*/RestaurantController.addTiming);
router.route('/partners/signup').post(/*passportAuth,*/PartnerController.profileUpload, PartnerController.partnersAdd);


/*Get Restaurant Details*/
router.route('/restaurant/list').get(/*passportAuth,*/RestaurantController.list);
//router.route('/restaurant/getList/:cuisineId').get(/*passportAuth,*/RestaurantController.list1);
router.route('/restaurant/searchCuisine/:cuisineName?').get(/*passportAuth,*/RestaurantController.searchCuisine);
router.route('/restaurant/getRestaurantCategory/:restaurantId').get(/*passportAuth,*/RestaurantController.getRestaurantCategory);
router.route('/restaurant/getAvailableCity/:cityName?').get(/*passportAuth,*/RestaurantController.getAvailableCity);
router.route('/restaurant/getNearLocation/:longitude/:latitude/:page').get(/*passportAuth,*/RestaurantController.Getlocation);
router.route('/restaurant/getCategories/:longitude/:latitude').get(/*passportAuth,*/RestaurantController.GetCusineFilter);
router.route('/restaurant/getCusine/:longitude/:latitude/:cuisineId').get(/*passportAuth,*/RestaurantController.GetCusine);

router.route('/restaurant/foodItem/:restaurantId').get(/*passportAuth,*/RestaurantController.GetFoodItem);
router.route('/restaurant/getMenu/itemId/:foodId/tagId/:tagId').get(RestaurantController.getMenu);
router.route('/restaurant/mostPopular').get(RestaurantController.mostPopular);
router.route('/restaurant/topCategory').get(RestaurantController.topCategory);

/*Orders*/
//router.route('/restaurant/getMenu/itemId/:foodId/tagId/:tagId').post(/*,validate(ordersValidator.validation.newOrders),*/CartController.getMenu1);

router.route('/restaurant/getMenu/itemId/:foodId/tagId/:tagId').post(/*,validate(ordersValidator.validation.newOrders),*/CartController.getMenu);

/*Check Out*/
router.route('/order/removeItem/:itemCartId').post(/*,validate(ordersValidator.validation.newOrders),*/CartController.removeItem);
router.route('/order/updateCart/:itemCartId').post(validate(ordersValidator.validation.updateCart), CartController.updateCart);
router.route('/order/getCart/:cartId').get(CartController.getList);
router.route('/order/getCheckOut/:cartId').get(CartController.getCheckOutList);
router.route('/order/getCart/:itemCartId').post(CartController.getCartList);

/*New Orders*/
router.route('/order/new-order').post(passportAuth,OrderController.newOrder);
router.route('/order/getOrder/:id').get(passportAuth,OrderController.getOrder);
router.route('/order/upcomingOrder').get(passportAuth, OrderController.upcomingOrderList);
router.route('/order/pastOrder').get(passportAuth,OrderController.pastOrderList);

/*Apply Voucher*/
router.route('/order/voucher/orderId/:orderId/userId/:userId').post(passportAuth,CartController.OrderVoucher);
router.route('/order/receipt/:id').get(passportAuth,OrderController.getReceipt);
//router.route('/order/new-order/:cartId').post(passportAuth, CartController.newOrders);

/*All Side Bar Filter and Sort*/
//router.route('/restaurant/filter').get(/*passportAuth,*/RestaurantController.filter);

module.exports = router;