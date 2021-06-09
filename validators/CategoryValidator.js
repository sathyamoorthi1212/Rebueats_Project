const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.validation = {
  add:{
        body:{
          categoryName : Joi.string().required().error(errors =>{return {message: "CATEGORY_NAME_MUST_REQUIRED"}})
          
        },    
  },
  update:{
        body:{
          categoryName : Joi.string().required().error(errors =>{return {message: "CATEGORY_NAME_MUST_REQUIRED"}})
          
        }
  },
  
};
