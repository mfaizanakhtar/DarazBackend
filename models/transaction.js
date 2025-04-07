const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    TransactionDate:{type:Date,index:true},
    TransactionType:String,
    FeeName:String,
    TransactionNumber:String,
    Details:String,
    SellerSku:String,
    LazadaSku:String,
    Amount:Number,
    VATinAmount:Number,
    Statement:{type:String,index:true},
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
    ShopName:String,
    OrderItemUpdated:{type:Boolean,default:false},
    transType:String
})

transactionSchema.index({ TransactionNumber: 1, FeeName: 1 }, { unique: true });


const Transaction = new mongoose.model('Transaction',transactionSchema)

module.exports.Transaction = Transaction;