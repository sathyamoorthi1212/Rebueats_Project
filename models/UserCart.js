const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Config     = require('config');
const _C       = require('../config/constants');
const ObjectId = mongoose.Schema.ObjectId;


const UserCartSchema = new Schema({
  cartKey      : { type: String, required: true, /*unique: true,*/ default: _C.cartKey },
  userId       : { type: ObjectId,ref:'User' },
  uuid         : { type: String},
  //foodId       : { type: ObjectId, ref: 'RestaurantMenu', required:true},
  items        : [{
         foodId       : { type: ObjectId, ref: 'RestaurantMenu', required:true},
         itemName     : { type: String},
         price        : { type: Number},
         additionalCharges:{type:Number},
         addtionalNote    :{type:String}, 
         packagingCharges :{type:Number},
         sizeId       : {
                sizeId    :{ type: ObjectId },
                sizeAmount:{ type:Number}
         },
         multiSize    : { type: Array},
         itemImage    : { type: String},
         totalPrice   : { type: Number},
         quantity     : { type: Number},
         newCreatedAt : { type: Date,default: Date.now},
         newUpdatedAt : { type: Date,default: Date.now},
         status       : {
                  type: Number,
                  enum: [_C.status.active,_C.status.inactive,_C.status.deleted],
                  default: _C.status.adminPanel.active,
                  required: true
          },        
  }],
  restaurantId : { type: ObjectId, required:true, ref: 'Restaurant' },  
  tax          : { type: Number},
  deliveryFee  : { type: Number},
  status       : {
            type: Number,
            enum: [_C.status.active,_C.status.inactive,_C.status.deleted],
            default: _C.status.adminPanel.active,
            required: true
  },
},
{
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
    timestamps: true,
    collection: 'userCart'
});

UserCartSchema.methods.getUser = function(data) {
    return new Promise(async function(resolve, reject) {
        try {
            let checkUser = await userCartModel.find(data.query, data.fields).limit(1);
            console.log("SSSSSsss",checkUser[0].uuid);
            var checkUuid=checkUser[0].uuid;
            if (checkUser.length === 0) {

                return reject({ errmsg: 'INVALID_CART' });

            } else if (checkUuid) {
                
                return reject({ errmsg: 'PLEASE_SIGNIN' });
            }            
            else {
                return resolve(checkUser[0]);
            }
        } catch (err) {
            return reject(err);
        }
    });
}


UserCartSchema.index({ "updatedAt": 1 }, { expireAfterSeconds: 60 * 60 });

let userCartModel = mongoose.model('UserCart', UserCartSchema);
module.exports = userCartModel;

//module.exports = mongoose.model('UserCart', UserCartSchema);