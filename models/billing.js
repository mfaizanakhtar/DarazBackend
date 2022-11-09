const mongoose = require('mongoose');
const constants = require('../data/constants');

const billingSchema = new mongoose.Schema({
    billingId:Number,
    createdAt:Date,
    userEmail:String,
    subscriptionType:String,
    duration:Number,
    durationType:String,
    billingMethod:String,
    invoiceAmount:Number,
    bankDetail:Object,
    paymentUrl:String,
    transactionId:String,
    isFutureRequest:Boolean,
    screenShot:String,
    status:{type:String,default:constants.PENDING_PAYMENT}

})

const Billing = new mongoose.model('billing',billingSchema);

module.exports.Billing = Billing