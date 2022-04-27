const UserRoute = require('express').Router();
const ContactusModel = require('../../models/Contactus');
const Config=require('config');
const Jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const _C       = require('../../config/constants');

/** 
 * Add Contactus
 * url : /api/admin/contactus/add
 * method : POST
 * author : Sathyamoorthi.R 
*/
exports.add  = async (req, res) => {
  
  try{
        let newDoc = new ContactusModel(req.body);
        newDoc = await newDoc.save();

        if(newDoc && newDoc.length !== 0){
              let contactusDetails={
                   _id              : newDoc._id,
                   contactusName    : newDoc.contactusName,
                   contactusEmail   : newDoc.contactusEmail,                   
                   contactusMobile  : newDoc.contactusMobile,
                   contactusMessage : newDoc.contactusMessage,
               }                    
            return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("CONTACTUS_DATA_SUCCESS"),'data':contactusDetails}); 
        }
            return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':req.i18n.__("INVALID_DATA")}); 

  }catch (err) {
        console.log(err);
            /*if (err.code == 11000) {
                err.errmsg = req.i18n.__("CUISINE_UNIQUE_ERROR");              
            }*/
          return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err});

  }
};

exports.getCms  = async function( req, res ) {
    try{
        let data=[{
                'cmsTitle'      :"About Us",
                'cmsDescription':"When writing essays, research papers, books, etc., new paragraphs are indented to show their beginnings. Each new paragraph begins with a new indentation.",
                'cmsUrl'        :'about-us'
                },
                {
                'cmsTitle'      :"Terms and Conditions",
                'cmsDescription':"When writing essays, research papers, books, etc., new paragraphs are indented to show their beginnings. Each new paragraph begins with a new indentation.",
                'cmsUrl'        :'terms'
                },
                ]
        return res.status(HttpStatus.OK).json({ 'success': true, 'message':req.i18n.__("GET_DETAILS_SUCCESS"),'data':data}); 

    } catch (err) {
        console.log("err", err);
        return res.status(HttpStatus.NOT_FOUND).json({ 'success': false, 'message':(err.errmsg)?(err.errmsg):err});
    }
}
