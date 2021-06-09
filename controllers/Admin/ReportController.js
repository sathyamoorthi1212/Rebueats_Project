const _ = require('lodash');
const _H = require('../../services/helper');
const _C = require('../../config/constants');
const Moment = require('moment');
const Config = require('config');
const HttpStatus = require('http-status-codes');
const OrderModel = require('../../models/Orders');
const UserModel = require('../../models/User');
const DriverModel = require('../../models/Driver');
const HelperFunc = require('./Function');



/** 
 * Get Customer Report
 * url : api/admin/dashboard
 * method : GET
 * author : Sathyamoorthi.R
**/
exports.getCustomerReport = async function(req, res){
	try{
		let responseData = { customerReportList: [] };
		let cond      = { status: _C.status.active };
		let pageQuery = HelperFunc.paginationBuilder(req.query);
        let likeQuery = HelperFunc.likeQueryBuilder(req.query);

		/*if(req.query.fromDate && req.query.toDate){
			cond['orderDate'] = { $gte: new Date(moment(req.query.fromDate).startOf('day').format()), $lt:  new Date(moment(req.query.toDate).endOf('day').format()) };
		} else if(req.query.fromDate){
			cond['orderDate'] = { $gte: new Date(moment(req.query.fromDate).startOf('day').format()) };
		} else if(req.query.toDate){
			cond['orderDate'] = { $lte: new Date(moment(req.query.toDate).endOf('day').format()) };
		}*/		

		let model = await OrderModel.aggregate([{
            "$match": cond
        }, {
            "$sort": { 'orderDate': -1 }
        }, {
            "$lookup": {
                "localField": "userId",
                "from": "user",
                "foreignField": "_id",
                "as": "userId"
            }
        }, {
            "$unwind": {
                "path": "$userId",
                "preserveNullAndEmptyArrays": true
            }
        }, {
            "$group": {
                "_id":"$userId",
                "totalOrder": {
                    "$sum": 1
                },
                "paidOrder": {
                    "$sum": {
	                    "$cond": {
	                        if: {
	                            "$eq": ['$paymentReceived', 1]
	                        },
	                        then: 1,
	                        else: 0
	                    }
	                }
                },
                "cancelledOrder": {
                    "$sum": {
	                    "$cond": {
	                        if: {	                            
	                             "$eq": ['$orderStatus.code', 7]
	                        },
	                        then: 1,
	                        else: 0
	                    }
	                }
                }
            }
        }, {
            "$project": {
                "_id": 0,
                "firstName": "$_id.firstName",
                "lastName": "$_id.lastName",
                "totalOrder": 1,
                "paidOrder": 1,
                "cancelledOrder": 1
            }
        }, {
            "$skip": pageQuery.skip
        }, {
            "$limit": pageQuery.take
        }]).exec();
        if(model && model.length > 0){        	
        	let totalBooking = await OrderModel.aggregate([{
	            "$match": cond
	        }, {
	            "$lookup": {
	                "localField": "userId",
	                "from": "user",
	                "foreignField": "_id",
	                "as": "userId"
	            }
	        }, {
	            "$unwind": {
	                "path": "$userId",
	                "preserveNullAndEmptyArrays": true
	            }
	        }, {
	            "$group": {
	                "_id":"$userId",
	            }
	        }, {
	            "$project": {
	                "_id": 0
	            }
	        }]).exec();

	        responseData.customerReportList = _.map(model, function(o){
	        	return {
					userName        : (o.firstName + ' '+ o.lastName),
					totalOrder    : o.totalOrder,
					paidOrder     : o.paidOrder,
					cancelledOrder: o.cancelledOrder
	        	}
	        });
        }

		return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("GET_CUSTOMER_REORT"), 'data':responseData });
	} catch(err){
		console.log("err", err);
		return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

	}
}