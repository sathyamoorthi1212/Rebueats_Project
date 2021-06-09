const express = require('express');
const passport = require('passport');
const router = express.Router();
const passportAuth = passport.authenticate("jwt", { session: false });
const validate = require('express-validation');

const AdminController = require('../controllers/Admin/AdminController');
const CuisineController = require('../controllers/Admin/CuisineController');
const CurrencyController = require('../controllers/Admin/CurrencyController');
const PromoCodeController = require('../controllers/Admin/PromoCodeController');
const RestaurantRatingController = require('../controllers/Admin/RestaurantRatingController');
const DriverRatingController = require('../controllers/Admin/DriverRatingController');
const CategoryController = require('../controllers/Admin/CategoryController');
const UserController = require('../controllers/Admin/UserController');
const DriverController = require('../controllers/Admin/DriverController');
const RestaurantController = require('../controllers/Admin/RestaurantController');
const PartnerController = require('../controllers/Admin/PartnerController');
const ContactusController = require('../controllers/Admin/ContactusController');
const OrderController = require('../controllers/Admin/OrderController');
const FaqController = require('../controllers/Admin/FaqController');
const CmsController = require('../controllers/Admin/CmsController');
const SettingController = require('../controllers/Admin/SettingController');
const DashboardController = require('../controllers/Admin/DashboardController');
const ReportController = require('../controllers/Admin/ReportController');


const adminValidator = require('../validators/AdminValidator');
const faqValidator = require('../validators/FaqValidator');
const currencyValidator = require('../validators/CurrencyValidator');
const promoCodeValidator = require('../validators/PromoCodeValidator');
const categoryValidator = require('../validators/CategoryValidator');
const restaurantValidator = require('../validators/RestaurantValidator');
const contactusValidator = require('../validators/ContactusValidator');
const cmsValidator = require('../validators/CMSValidator');
const settingValidator = require('../validators/SettingValidator');
const restaurantTimeValidator = require('../validators/restaurantTimingValidator');


router.route('/login').post(validate(adminValidator.validation.login), AdminController.login);
router.route('/signup').post(validate(adminValidator.validation.signup), AdminController.signup);
router.route('/getUsers').get(passportAuth, AdminController.getUsers);
router.route('/logout/:id').post(passportAuth, AdminController.logout);
router.route('/update/:id').put(passportAuth, AdminController.update);
router.route('/forgetPassword/:email').post(passportAuth, AdminController.forgetPassword);
router.route('/delete/:id').post(passportAuth, AdminController.delete);
router.route('/changePassword/:id').post(passportAuth, validate(adminValidator.validation.changePassword), passportAuth, AdminController.changePassword);
router.route('/changeStatus/:AdminId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, AdminController.changeStatus);


/*Cuisine Routes*/
router.route('/cuisine/add').post(passportAuth, CuisineController.profileUpload, CuisineController.add);
router.route('/cuisine/update/:id').put(passportAuth, CuisineController.profileUpload, CuisineController.update);
router.route('/cuisine/getCuisine/:id?').get(passportAuth, CuisineController.getCuisine);
router.route('/cuisine/delete/:id').post(passportAuth, CuisineController.delete);
router.route('/cuisine/activeCuisine').get(passportAuth, CuisineController.activeCuisine);
router.route('/cuisine/changeStatus/:CuisineId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, CuisineController.changeStatus);

/*Currency Routes*/
router.route('/currency/add').post(passportAuth, validate(currencyValidator.validation.add), CurrencyController.add);
router.route('/currency/update/:id').put(passportAuth, validate(currencyValidator.validation.update), CurrencyController.update);
router.route('/currency/getCurrency/:id?').get(passportAuth, CurrencyController.getCurrency);
router.route('/currency/list').get(passportAuth, CurrencyController.list);
router.route('/currency/delete/:id').post(passportAuth, CurrencyController.delete);
router.route('/currency/changeStatus/:CurrencyId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, CurrencyController.changeStatus);

/*Category Routes*/
router.route('/category/add').post(/* passportAuth, */ validate(categoryValidator.validation.add), CategoryController.add);
router.route('/category/update/:id').put(passportAuth, validate(categoryValidator.validation.update), CategoryController.update);
router.route('/category/getCategory/:id?').get(passportAuth, CategoryController.getCategory);
router.route('/category/delete/:id').post(passportAuth, CategoryController.delete);
router.route('/category/changeStatus/:CategoryId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, CategoryController.changeStatus);
/*Contactus*/
router.route('/contactus/list/:id?').get(passportAuth/*,validate(categoryValidator.validation.add)*/, ContactusController.list);

/*Restaurant*/
router.route('/restaurant/add').post(passportAuth, RestaurantController.profileUpload, RestaurantController.add);
router.route('/restaurant/getAll/:id?').get(passportAuth, RestaurantController.profileUpload, RestaurantController.getAll);
router.route('/restaurant/generateCSV').get(passportAuth, RestaurantController.restaurantGenerateCSV);
router.route('/restaurant/activeRestaurant').get(passportAuth, RestaurantController.activeRestaurant);
router.route('/restaurant/update/:id?').put(passportAuth, RestaurantController.profileUpload, RestaurantController.update);
router.route('/restaurant/delete/:id').post(passportAuth, RestaurantController.profileUpload, RestaurantController.deleteRestaurant);
router.route('/restaurant/timing/:restaurantId').post(/* passportAuth, */restaurantTimeValidator.restaurantTimeValidator, RestaurantController.restaurantTiming);
router.route('/restaurant/timing/list/:restaurantId').get(RestaurantController.listRestaurantTiming);
router.route('/restaurant/updateTiming/:restaurantId').put(restaurantTimeValidator.restaurantTimeValidator, RestaurantController.updateTiming);
/*Restaurant Food items  */
router.route('/restaurant/newTag/:restaurantId').post(passportAuth, validate(restaurantValidator.restaurantFoodItem.tags), RestaurantController.addRestaurantTag);
router.route('/restaurant/updateTag/restaurantId/:restaurantId').put(passportAuth, validate(restaurantValidator.restaurantFoodItem.tags), RestaurantController.updateRestaurantTag);
router.route('/restaurant/deleteTag/tagId/:tagId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deletetag);
router.route('/restaurant/newMenu/:restaurantId').post(passportAuth, validate(restaurantValidator.restaurantFoodItem.menu), RestaurantController.addRestaurantMenu);
router.route('/restaurant/deleteMenu/menuId/:menuId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deleteMenu);
router.route('/restaurant/updateMenu/menuId/:menuId/restaurantId/:restaurantId').put(passportAuth, validate(restaurantValidator.restaurantFoodItem.update), RestaurantController.updateRestaurantMenu);
router.route('/restaurant/newItem/:restaurantId').post(passportAuth, RestaurantController.profileUpload, RestaurantController.addRestaurantItem);
router.route('/restaurant/updateItem/foodId/:foodId/restaurantId/:restaurantId').put(passportAuth, RestaurantController.profileUpload, RestaurantController.updateRestaurantItem);
router.route('/restaurant/deleteItem/foodId/:foodId/restaurantId/:restaurantId').post(passportAuth, RestaurantController.deleteItem);
router.route('/restaurant/listRestaurantTag/:id').get(passportAuth, RestaurantController.listRestaurantTag);
router.route('/restaurant/activeTag/:id').get(passportAuth, RestaurantController.activeTag);
router.route('/restaurant/listRestaurantMenus/:id').get(passportAuth, RestaurantController.listRestaurantMenus);
router.route('/restaurant/listRestaurantItems/:id').get(passportAuth, RestaurantController.listRestaurantItems);
router.route('/restaurant/listRestaurant/:id').get(passportAuth, RestaurantController.listRestaurant);
router.route('/restaurant/changeStatus/:RestaurantId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, RestaurantController.changeStatus);
/*Partner*/
router.route('/partners/add').post(passportAuth, PartnerController.profileUpload, PartnerController.partnersAdd);
router.route('/partners/list/:id?').get(passportAuth, PartnerController.profileUpload, PartnerController.partnersList);
router.route('/partners/delete/:id').post(passportAuth, PartnerController.partnersDelete);
router.route('/partners/update/:id').put(passportAuth, PartnerController.profileUpload, PartnerController.partnersUpdate);
router.route('/partners/activePartner').get(passportAuth, PartnerController.activePartner);
router.route('/partners/generateCSV').get(passportAuth, PartnerController.generateCSV);
router.route('/partners/changeStatus/:PartnerId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, PartnerController.changeStatus)
// /*Partner Timing  */
// router.route('/restaurant/timing/:restaurantId').post(/* passportAuth, */restaurantTimeValidator.restaurantTimeValidator, PartnerController.restaurantTiming);
// router.route('/restaurant/timing/list/:restaurantId').get(PartnerController.listRestaurantTiming);

// /*Restaurant Timing  */
// router.route('/restaurantTiming/:restaurantId').post(/*passportAuth, */restaurantTimeValidator.restaurantTimeValidator, RestaurantController.restaurantTiming);
// router.route('/restaurantTiming/list/:restaurantId').get(passportAuth, RestaurantController.listRestaurantTiming);



/* Restaurant Rating*/
router.route('/restaurantRating/listRestaurantRating').get(passportAuth, RestaurantRatingController.listRestaurantRating);
router.route('/restaurantRating/listItemRating/:foodId').get(passportAuth, RestaurantRatingController.listItemRating);
router.route('/restaurantRating/getRestaurantRatingOne/:id').get(passportAuth, RestaurantRatingController.getRestaurantRatingOne);
router.route('/restaurantRating/delete/:id').post(passportAuth, RestaurantRatingController.delete);
router.route('/restaurantRating/changeStatus/:RestaurantRatingId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, RestaurantRatingController.changeStatus)

/* DriverRating */
router.route('/driverRating/listDriverRating').get(passportAuth, DriverRatingController.listDriverRating);
router.route('/driverRating/getdriverRatingOne/:id').get(passportAuth, DriverRatingController.getDriverRatingOne);
router.route('/driverRating/delete/:id').post(passportAuth, DriverRatingController.delete);
router.route('/driverRating/changeStatus/:DriverRatingId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, DriverRatingController.changeStatus)

/* user  */
router.route('/user/create').post(passportAuth, UserController.profileUpload, UserController.create);
router.route('/user/update/:id').put(passportAuth, UserController.profileUpload, UserController.update);
router.route('/user/delete/:id').post(passportAuth, UserController.delete);
router.route('/user/list').get(passportAuth, UserController.list);
router.route('/user/getuser/:id').get(passportAuth, UserController.getuser);
router.route('/user/generateCSV').get(passportAuth, UserController.generateCSV);
router.route('/user/changeStatus/:UserId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, UserController.changeStatus)

/*driver */
router.route('/driver/create').post(passportAuth, DriverController.profileUpload, DriverController.create);
router.route('/driver/update/:id').put(passportAuth, DriverController.profileUpload, DriverController.update);
router.route('/driver/delete/:id').post(passportAuth, DriverController.delete);
router.route('/driver/list').get(passportAuth, DriverController.list);
router.route('/driver/getdriver/:id').get(passportAuth, DriverController.getdriver);
router.route('/driver/generateCSV').get(passportAuth, DriverController.generateCSV);
router.route('/driver/changeStatus/:DriverId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, DriverController.changeStatus)
/*promoCode*/
router.route('/promoCode/add').post(passportAuth, validate(promoCodeValidator.validation.add), PromoCodeController.add);
router.route('/promoCode/update/:id').put(passportAuth, validate(promoCodeValidator.validation.update), PromoCodeController.update);
router.route('/promoCode/list').get(passportAuth, PromoCodeController.list);
router.route('/promoCode/getPromoCode/:id').get(passportAuth, PromoCodeController.getPromoCode);
router.route('/promoCode/delete/:id').post(passportAuth, PromoCodeController.delete);
router.route('/promoCode/changeStatus/:PromoId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, PromoCodeController.changeStatus)

/*order */
router.route('/order/listOrder').get(passportAuth, OrderController.listOrder);
router.route('/order/listAcceptedOrder').get(passportAuth, OrderController.listAcceptedOrder);
router.route('/order/getOrder/:id').get(passportAuth, OrderController.getOrder);
router.route('/order/getAccepted/:id').get(passportAuth, OrderController.getAccepted);
router.route('/order/accepted/generateCSV').get(passportAuth, OrderController.acceptedGenerateCSV);
router.route('/order/pending/generateCSV').get(passportAuth, OrderController.pendingGenerateCSV);
router.route('/order/listDeliveryOrder').get(passportAuth, OrderController.listDeliveryOrder);
router.route('/order/getDelivery/:id').get(passportAuth, OrderController.getDelivery);
router.route('/order/delivery/generateCSV').get(passportAuth, OrderController.deliveryGenerateCSV);
/*FAQ*/
router.route('/faq/addFaq').post(passportAuth, validate(faqValidator.validation.create), FaqController.addfaq);
router.route('/faq/listFaq').get(passportAuth, FaqController.listFaq);
router.route('/faq/updateFaq/:id').put(passportAuth, validate(faqValidator.validation.update), FaqController.updateFaq);
router.route('/faq/deletefaq/:id').post(passportAuth, FaqController.deletefaq);
router.route('/faq/getFaq/:id').get(passportAuth, FaqController.getFaq);
router.route('/faq/changeStatus/:FaqId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, FaqController.changeStatus);
/* FAQ CATEGORY */
router.route('/faq/addfaqcategory').post(passportAuth, validate(faqValidator.validation.add), FaqController.addfaqcategory);
router.route('/faq/listFaqCategory').get(passportAuth, FaqController.listFaqCategory);
router.route('/faq/getFaqCategory').get(passportAuth, FaqController.getFaqCategory);
router.route('/faq/updateFaqCategory/:id').put(passportAuth, validate(faqValidator.validation.updateFaqCategory), FaqController.updateFaqCategory);
router.route('/faq/deleteFaqCategory/:id').post(passportAuth, FaqController.deleteFaqCategory);
/* CMS */
router.route('/cms/addCms').post(passportAuth, validate(cmsValidator.validation.add), CmsController.addCms);
router.route('/cms/listCms').get(passportAuth, CmsController.listCms);
router.route('/cms/updateCms/:id').put(passportAuth, validate(cmsValidator.validation.update), CmsController.updateCms);
router.route('/cms/deleteCms/:id').post(passportAuth, CmsController.deleteCms);
router.route('/cms/changeStatus/:CmsId').post(passportAuth, validate(currencyValidator.validation.changeStatus), passportAuth, CmsController.changeStatus);
/*Setting*/
router.route('/setting/create').post(passportAuth, validate(settingValidator.validation.create), SettingController.create);
router.route('/setting/smtp').put(passportAuth, validate(settingValidator.validation.updateSMTPSetting), SettingController.updateSmtp);
router.route('/setting/sms').put(passportAuth, validate(settingValidator.validation.updateSMSSetting), SettingController.updateSms);
router.route('/setting/app').put(passportAuth, SettingController.profileUpload, SettingController.updateApp);
router.route('/setting/list').get(passportAuth, SettingController.list);
router.route('/setting/social').put(passportAuth, SettingController.updateSocial);
/*Dashboard*/
router.route('/dashboard').get(passportAuth, DashboardController.dashboard);

/*Site Statistics Chart*/
router.route('/statistics-chart/month').get(passportAuth, DashboardController.statisticsMonthChart);
router.route('/statistics-chart/year').get(passportAuth, DashboardController.statisticsYearChart);

/*Reports*/
router.route('/customer-report/:fromDate?/:toDate?').get(passportAuth, ReportController.getCustomerReport);



module.exports = router;