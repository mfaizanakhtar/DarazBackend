const mongoose = require('mongoose')

const billingSchema = new mongoose.Schema({
    billingId:Number,
    createdAt:Date,
    userEmail:String,
    subscriptionType:String,
    duration:Number,
    durationType:String,
    pricing:Number,
    invoiceAmount:Number,
    bankDetail:Object,
    transactionId:String,
    isFutureRequest:Boolean,
    status:{type:String,default:"pending"}

})

const Billing = new mongoose.model('billing',billingSchema);

module.exports.Billing = Billing