const Faq = require('../../models/Faq');
const Faqcategory = require('../../models/Faqcategory');
const objectId = require('mongoose').Types.ObjectId;
const HttpStatus = require('http-status-codes');
const HelperFunc = require('./Function');
const _C = require('../../config/constants');
const _ = require('lodash');

/**
 * List FAQ 
 */
exports.listFaq = async (req, res) => {
    try {
        var pagination = true, Condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getFaqCount = await Faq.find(condition).count();
            res.header('x-total-count', getFaqCount);
        }
        let getFaqList = await Faq.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take)
            .select('_id question answer status faqcategoryId')
            .populate('faqcategoryId', 'faqCategoryName _id')
            .exec();
        var fullname = _.map(getFaqList, function (o) {
            console.log("o", o);
            console.log("getFaqList", getFaqList);
            console.log("fullname", fullname);
            return {
                _id: o._id,
                question: o.question,
                answer: o.answer,
                status: o.status,
                faqCategoryName: o.faqcategoryId.faqCategoryName,
                faqcategoryId: o.faqcategoryId._id
            }
        })

        if (getFaqList && getFaqList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_LIST_SUCCESS"), 'data': fullname });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/**
 * Get FAQ
 */

exports.getFaq = async (req, res) => {
    try {
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        let getFaq = await Faq.find(condition)
            .select('_id question answer status faqcategoryId')
            .populate('faqcategoryId', 'faqCategoryName _id')
            .exec();
        var fullname = _.map(getFaq, function (o) {
            return {
                _id: o._id,
                question: o.question,
                answer: o.answer,
                status: o.status,
                faqCategoryName: o.faqcategoryId.faqCategoryName,
                faqcategoryId: o.faqcategoryId._id,
            }
        })

        if (getFaq && getFaq.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_LIST_SUCCESS"), 'data': fullname });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_NOT_FOUND"), 'data': {} });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};


/**
 * Add FAQ 
 */
exports.addfaq = async (req, res) => {
    console.log("req.body", req.body)
    try {
        let newDoc = new Faq(req.body);

        newDoc = await newDoc.save();
        console.log("newDoc", newDoc)
        if (newDoc && newDoc.length !== 0) {
            let updateData = {
                _id: newDoc._id,
                faqcategoryId: newDoc.faqcategoryId,
                question: newDoc.question,
                answer: newDoc.answer,
            }
            console.log("updateData", updateData)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_ADDED_SUCCESSFULLY"), 'data': updateData });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("FAQ_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/**
 * Update FAQ 
 */
exports.updateFaq = async (req, res) => {
    console.log("req.body", req.body)
    try {
        let faqUpdate = await Faq.findOneAndUpdate({ '_id': req.params.id }, { 'faqcategoryId': req.body.faqcategoryId, 'question': req.body.question, 'answer': req.body.answer }, { 'fields': { "_id": 1, "faqcategoryId": 1, "question": 1, "answer": 1 }, new: true });

        if (faqUpdate && faqUpdate.length !== 0) {
            console.log("faqUpdate", faqUpdate)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_DATA_UPDATE_SUCCESS"), 'data': faqUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("FAQ_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/**
 * Delete FAQ 
 */
exports.deletefaq = async (req, res) => {
    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteCurrency = await Faq.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteCurrency) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};

/**
 * Add FAQ Category 
 */
exports.addfaqcategory = async (req, res) => {
    console.log("req.body", req.body)
    try {
        let newDoc = new Faqcategory(req.body);
        newDoc = await newDoc.save();
        console.log("newDoc", newDoc)
        if (newDoc && newDoc.length !== 0) {
            let addData = {
                _id: newDoc._id,
                faqCategoryName: newDoc.faqCategoryName,
            }
            console.log("addData", addData)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_CATEGORY_ADDED_SUCCESSFULLY"), 'data': addData });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("INVALID_DATA") });
    } catch (err) {
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("FAQ_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}
exports.listFaqCategory = async (req, res) => {
    try {
        var pagination = true, Condition = {};
        var likeQuery = HelperFunc.likeQueryBuilder(req.query);
        var pageQuery = HelperFunc.paginationBuilder(req.query);
        var sortQuery = HelperFunc.sortQueryBuilder(req.query);
        if (req.params.id) {
            pagination = false;
            condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        }
        if (pagination) {
            condition = likeQuery;
            condition['status'] = _C.status.adminPanel.active;
            let getFaqCategoryCount = await Faqcategory.find(condition).count();
            res.header('x-total-count', getFaqCategoryCount);
        }
        let getFaqCategoryList = await Faqcategory.find(condition).sort(sortQuery).skip(pageQuery.skip).limit(pageQuery.take).select('_id faqCategoryName').exec();

        if (getFaqCategoryList && getFaqCategoryList.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_CATEGORY_LIST_SUCCESS"), 'data': getFaqCategoryList });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_CATEGORY_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

exports.getFaqCategory = async (req, res) => {
    try {
        let getFaqCategory = await Faqcategory.find({ status: _C.status.adminPanel.active })
            .select('_id faqCategoryName').exec();

        if (getFaqCategory && getFaqCategory.length > 0) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_CATEGORY_LIST_SUCCESS"), 'data': getFaqCategory });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_CATEGORY_NOT_FOUND"), 'data': [] });
    } catch (err) {
        console.log("error here", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
}

/**
 * Update FAQ Category 
 */
exports.updateFaqCategory = async (req, res) => {
    console.log("req.body", req.body)
    try {
        let faqCategoryUpdate = await Faqcategory.findOneAndUpdate({ '_id': req.params.id }, { 'faqCategoryName': req.body.faqCategoryName }, { 'fields': { "_id": 1, "faqCategoryName": 1 }, new: true });

        if (faqCategoryUpdate && faqCategoryUpdate.length !== 0) {
            console.log("faqCategoryUpdate", faqCategoryUpdate)
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_CATEGORY_DATA_UPDATE_SUCCESS"), 'data': faqCategoryUpdate });
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_CATEGORY_NOT_FOUND") });

    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            err.errmsg = req.i18n.__("FAQ_CATEGORY_UNIQUE_ERROR");
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};


/**
 * Delete FAQ Category 
 */
exports.deleteFaqCategory = async (req, res) => {
    try {
        let condition = { _id: req.params.id, status: _C.status.adminPanel.active };
        let deleteFaqCategory = await Faqcategory.findOneAndUpdate(condition, { status: _C.status.adminPanel.deleted }, { new: true });

        if (deleteFaqCategory) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_CATEGORY_DELETE_SUCCESS") });

        } else {
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_CATEGORY_NOT_FOUND") });
        }
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });

    }
};


exports.changeStatus = async (req, res) => {
    try {
        let changeStatus = await Faq.findOneAndUpdate({ '_id': req.params.FaqId }, { new: true });
        if (changeStatus) {
            return res.status(HttpStatus.OK).json({ 'success': true, 'message': req.i18n.__("FAQ_STATUS_CHANGES_SUCCESSFULLY") })
        }
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': req.i18n.__("FAQ_STATUS_NOT_CHANGED") })
    } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message': (err.errmsg) ? (err.errmsg) : err });
    }
};
