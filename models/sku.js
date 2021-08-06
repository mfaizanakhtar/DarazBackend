const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
    name:String,
    cost:{
        type:Number,
        default:0
    },
    stock:{
        type:Number,
        default:-1
    },
    useremail:String
})

const Sku = mongoose.model('sku',skuSchema);

module.exports.Sku = Sku;