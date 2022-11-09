const mongoose = require('mongoose')
const moment = require('moment');


const couponSchema = new mongoose.Schema({
    couponCode:{type:String,unique:true,required:true},
    createdAt:{type:Date,default:moment().toDate()},
    active:{type:Boolean,default:true},
    startDate:Date,
    endDate:Date,
    type:String,
    value:Number,
    minAmount:Number,
    maxCap:Number,
    isMaxUsage:{type:Boolean,default:false},
    maxUsage:{type:Number,default:0}
})

const Coupon = mongoose.model('coupon',couponSchema);

module.exports.Coupon = Coupon;