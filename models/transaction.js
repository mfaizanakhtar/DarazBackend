const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    TransactionDate:Date,
    TransactionType:String,
    FeeName:String,
    TransactionNumber:String,
    Details:String,
    SellerSku:String,
    LazadaSku:String,
    Amount:Number,
    VATinAmount:Number,
    Statement:String,
    PaidStatus:String,
    OrderNo:String,
    OrderItemNo:String,
    OrderItemStatus:String,
    ShippingSpeed:String,
    ShipmentType:String,
    Reference:String,
    PaymentRefId:String,
    userEmail:String,
    ShopShortCode:String,
    OrderItemUpdated:{type:Boolean,default:false},
    transType:String
})

const Transaction = new mongoose.model('Transaction',transactionSchema)

module.exports.Transaction = Transaction;