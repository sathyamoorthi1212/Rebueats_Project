var Path = require('path');

module.exports = {
    status: {
        active: 1,
        inactive: 2,
        deleted: 3,
        user: { active: 1, inactive: 2, deleted: 3, online: 4, offline: 5 },
        admin: { active: 1, inactive: 2, deleted: 3, online: 4, offline: 5 },
        driver: { active: 1, inactive: 2, deleted: 3, online: 4, offline: 5 },
        otpVerify: { notVerified: false, verified: true },
        order: { pending: 1, confirmed: 2, accepted: 3, pickup: 4, ontheway: 5, arrived: 6, delivery: 7, cancel: 8 },
        adminPanel: { active: 1, inactive: 2, deleted: 3 },
        payment: { cod: 1, paypal: 2, paytm: 3 },
        paymentType: { offline: 1, online: 2 },
        paymentReceived:{received:1,notReceived:2},
        deliveryType: { pickup: 1, delivery: 2 },
        promoType: { percentage: 1, amount: 2 },
        app: { admin: 1, customer: 2, driver: 3 },
        cms: { aboutUs: 1, privacyPolicy: 2, termsAndConditions: 3, others: 4 }

    },
    path: {
        userImagePath: '/user/',
        restaurantImagePath: '/restaurant/',
        foodItemImagePath: '/food/',
        partnersImagePath: '/partner/',
        cuisineImagePath: '/cuisine/',
        siteImagePath: '/site/',
    },
    pagination: {
        userPageSize: 10,
        pageSize: 30,
    },
    defaultDriverRequest: {
        expire: '10',
        type: 'Minutes'
    },
    cartKey: 'rebuEats',
    siteKey: 'app-setting'
}




