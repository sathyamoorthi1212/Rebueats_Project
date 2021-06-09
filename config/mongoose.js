const mongoose = require('mongoose');
const Config=require('config');
const chalk_log  = Config.CHALK_LOG;
const chalk_error= Config.CHALK_ERROR;
const logger = require('../services/logger');

try {  
  var db = mongoose.connect(`mongodb://${Config.database.host}:${Config.database.port}/${Config.database.dbname}`,{useMongoClient: true}, function(error){
    if(error) 
      {
      	console.log("error",error)
          logger.error(chalk_log(error));
      }else{
         console.log(chalk_log('Connection with database succeeded.'));
      }
    });
} catch (err) {
  console.log(chalk_log('Connection failed.'));
}

module.exports = {mongoose};