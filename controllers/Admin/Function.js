const moment = require('moment');

/**
 *  likeQueryBuilder
 * @input  
 * @param 
 * @return null
 * @response null
 */
 exports.likeQueryBuilder = (query="") => { 
  var likeQuery = {};   
  for (let key of Object.keys(query)) {  
    let value = query[key];  
    if (key.indexOf('_like') > -1)
    {
      var res = key.split("_like");
      if(res[0]){
        // console.log(res[0]);
        likeQuery[res[0]] = new RegExp( value , 'i') ; 
      } 
    }  
  }  
  return likeQuery; 
}

 /**
 * Find Query Builder
 * @input  
 * @param 
 * @return null
 * @response null
 */
 exports.findQueryBuilder = (query="",likeQuery='') => { 
    var fromDate = '';
    var toDate = '';
    var likekey = '';
    for (let key of Object.keys(query)) {  
      let value = query[key];  
      if (key.indexOf('_gte') > -1)
      {
        var res = key.split("_gte");
        if(res[0]){ 
          likekey = res[0]; 
          fromDate = value;
        } 
      } 

      if (key.indexOf('_lte') > -1)
      {
        var res = key.split("_lte");
        if(res[0]){ 
          likekey = res[0]; 
          toDate = moment(value).add(1,'days').format('YYYY-MM-DD');//value;
        } 
      }  

    }  
 
   if (fromDate  && toDate && toDate != 'Invalid date' ) { 
      likeQuery[likekey] =  { '$gte': new Date(fromDate), '$lte': new Date(toDate) }; 
   }else if(fromDate){
      likeQuery[likekey] =  { '$gte': new Date(fromDate) };  
   }else if(toDate){
      likeQuery[likekey] =  { '$lte': new Date(toDate) };  
   }   
   return likeQuery; 
}

 /**
 *  paginationBuilder
 * @input  
 * @param 
 * @return null
 * @response null
 */
 exports.paginationBuilder = (query="") => { 
   var pagination = {}; 
   var take = query._limit;
   var pageNo = query._page; 
   var skip = (pageNo - 1 ) * take;
   pagination.take = Number(take);
   pagination.skip = Number(skip); 
   return pagination;
 }  

 /**
*  Sort Query Builder
* @input  
* @param 
* @return null
* @response null
*/
exports.sortQueryBuilder = (query = "") => {
  var sortQuery = {};
  var sort = query._sort; 
  var type = query._order; 
  if (type == 'ASC'){
    sortQuery[sort] = 1 ; 
  }else{
    sortQuery[sort] = -1; 
  }

  if (sortQuery["date"]) {
    sortQuery["createdAt"] = sortQuery["date"];
    delete sortQuery["date"];
  }

  return sortQuery; 
}