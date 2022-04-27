'use strict'

const _C = require('./constants');


module.exports = {
    name: {
        min: 3,
        max: 35,
        expression: ''
    },
    mobile_number: {
        expression: '^[0-9]{8,15}$'
    },
    email_address: {
        expression: '^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})*$',
        min: 3,
        max: 256
    },
    password: {
        expression: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[$@$!%*?&.])[A-Za-z\\d$@$!%*?&.]{6,12}$'
    },
    country_code: {
        min: 2,
        max: 6,
        expression: '^(\\+)[0-9]{2,6}$'
    },
    dob: {
        format: 'YYYY-MM-DD'
    },
    device_type: {
        allow_only: [1, 2] /* 1 = iOS , 2 = Android*/
    },
    image: {
        allow_only: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'application/pdf'],
        maximum_size: 99999999999999
    },
    code: {
        length: 6
    },
    payment_mode: {
        allow_only: [1, 2] /*1-Pickup ,2-Drop*/
    },
    driver_status: {
        allow_only: [1, 2, 3, 4, 5, 6]
    },
    booking_driver_status: {
        allow_only: [3, 4, 5, 6]
    },
    gender: {
        // "allow_only" : ["male","female"]
        allow_only: [1, 2]
    },
    ingredient_type: {
        allow_only: [1, 2]
    },
    vendor_status: {
        allow_only: [1, 2, 3]
    },
    vendor_payment_type: {
        allow_only: [1, 2, 3]
    },
    payment_type_option: {
        allow_only: [1, 2, 3] /* 1-Wallet, 2-Cash, 3-Online */
    },
    vendor_notification_method: {
        allow_only: [0, 1, 2]
    },
    drivers_priority: {
        allow_only: [1, 2, 3]
    },
    driver_type: {
        allow_only: [1, 2, 3] /* 1-Agent, 2-Agent or Company Drivers 3-Envio Drivers */
    },
    app_type: {
        allow_only: [1, 2, 3] /* 1-Customer 2-Driver */
    },
    work_type: {
        allow_only: [1, 2] /* 1-Complete 2-Half Time */
    },
    shift_time: {
        allow_only: [1, 2] /* 1-Morning 2-Evening */
    },
    working_day: {
        allow_only: [1, 2, 3, 4, 5, 6, 7] /* 1-Monday 2-Tuesday,3-Wednesday,4-Thursday,5-Friday,6-Saturday 7-Sunday*/
    },
    doucument_type: {
        allow_only: [1, 2, 3, 4] /* 1-Driver License 2-Identify Document,3-Police Solvency,4-Criminal History */
    },
    cms_type: {
        allow_only: [1, 2, 3, 4] /* 1-About Us 2-Privacy Policy 3-Terms and conditions, 4-Others */
    },
    notification_type: {
        allow_only: [1, 2, 3] /* 1-Email 2-SMS 3-Application(Push) */
    },
    shared_key: {
        expression: '[a-zA-Z]',
        length: 4
    },
    order_type: {
        allow_only: [1, 2] /* 1-ASAP , 2-Later*/
    },
    vehicle_type: {
        allow_only: [1, 2, 3, 4] /* 1-Two-wheeler 2-Car 3-Bicycle 4-Any */
    },
    login_type: {
        allow_only: [1, 2, 3, 4, 5] /* 1-Email 2-Mobile_number 3-Facebook 4-Twitter 5-Gplus*/
    },
    page_flag: {
        allow_only: [0, 1, 2, 3, 4, 5, 6] /* 1-Dashboard  2-Vendor_map 3-Arrived 4-Confirm_order 5-Payment 6-Payment_confirm */
    },
    reviewed_by: {
        allow_only: [1, 2] /*1-Customer 2-Driver*/
    },
    rating: {
        minimum_rating: 0,
        maximum_rating: 5
    },
    payment_status: {
        allow_only: [1, 2] /* 1-Unpaid , 2-Paid*/
    },
    allocation_type: {
        allow_only: [1, 2] /*1-Manual, 2-Automatic*/
    },
    booking_status: {
        allow_only: [0, 1, 2, 3, 4, 5, 6, 7]
    },
    navigation: {
        allow_only: [1, 2] /*1-Google Map, 2-etc*/
    },
    changeDriverStatus: {
        allowOnly: [4, 5] /*4-Online, 5-Offline */
    },
    change_customer_status: {
        allow_only: [0, 1] /*1-Active, 0-Inactive*/
    },
    date: {
        format: 'DD/MM/YYYY'
    },
    is_favourite: {
        allow_only: [0, 1] /* 1-UnFavourite , 2-Favourite*/
    },
    sort_type: {
        allow_only: [0, 1, 2] /*1-date,2-distance*/
    },
    detail_type: {
        allow_only: [1, 2] /*1-pickup(booking),2-delivery*/
    },
    created_ref: {
        allow_only: [1, 2, 3] /*1-Admin ,2-Driver ,3-User*/
    },
    owner_ref: {
        allow_only: [1, 2] /*1-Admin ,2-Driver */
    },
    change_user_status: {
        allow_only: [1, 0] /*1-Active, 0-Inactive or Logout*/
    },
    language: {
        allow_only: ['en', 'es'] /*en-English, es-Spanish*/
    },
    label_app_type: {
        allow_only: [1, 2, 3, 4, 5, 6, 7, 8] /*1-Android Customer, 2-Iphone Customer, 3-Frontend customer, 4-Android Customer, 5-Iphone Customer, 6-Frontend customer, 7-Backend, 8-API*/
    },
    voucher_type: {
        allow_only: [1, 2] /* 1 = Amount , 2 = Percantage*/
    }
    /*payment_status: {
        allow_only: [_C.status.payment.pending, _C.status.payment.success, _C.status.payment.failed]
    },
    driver_commision_setup: {
        allow_only: [_C.status.commission_setup.bank, _C.status.commission_setup.cash]
    },
    commission_request_status: {
        allow_only: [_C.status.commission_req_status.pending, _C.status.commission_req_status.accepted, _C.status.commission_req_status.paid, _C.status.commission_req_status.rejected, _C.status.commission_req_status.cancelled]
    },
    role_status: {
        allow_only: [_C.status.deactive, _C.status.active]
    }
*/}