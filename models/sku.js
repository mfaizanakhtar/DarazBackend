const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
    name:String,
    cost:{
        type:Number,
        default:0
    },
    FBMpackagingCost:{
        type:Number,
        default:0
    },
    FBDpackagingCost:{
        type:Number,
        default:0
    },
    FBMstock:{
        type:Number,
        default:0
    },
    useremail:String
})

const Sku = mongoose.model('sku',skuSchema);

module.exports.Sku = Sku;