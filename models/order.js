const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    OrderId:{type:String,unique:false},
    CustomerFirstName:String,
    CustomerLastName:String,
    PaymentMethod:String,
    Price:Number,
    CreatedAt:Date,
    UpdatedAt:Date,
    AddressBilling:{
        FirstName:String,
        LastName:String,
        Phone:String,
        Address1:String,
        Address2:String,
        Address3:String,
        Address4:String,
        Address5:String,
        CustomerEmail:String,
        City:String,
        PostCode:String,
        Country:String,

    },
    AddressShipping:{
        FirstName:String,
        LastName:String,
        Phone:String,
        Address1:String,
        Address2:String,
        Address3:String,
        Address4:String,
        Address5:String,
        CustomerEmail:String,
        City:String,
        PostCode:String,
        Country:String,
        
    },
    ItemsCount:Number,
    OrderItems:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'OrderItem'
    }],
    Statuses:[String],
    Voucher:Number,
    VoucherPlatform:Number,
    VoucherSeller:Number,
    ShippingFee:Number,
    ShippingFeeOriginal:Number,
    ShippingFeeDiscountSeller:Number,
    ShippingFeeDiscountPlatform:Number,
    ShopShortCode:{type:String,unique:false},
    ShopName:String,
    ShopEmail:String,
    ShopLocation:String,
    UserEmail:String,
    DispatchDate:Date,
    ReturnDate:Date,
    WarehouseStatus:String,
    Skus:[String],
    BaseSkus:[String],
    isPrinted:{
        type:Boolean,
        default:false
    },
    Remarks:String

})
orderSchema.index({ OrderId: 1, ShopShortCode: 1 }, { unique: true })
const Order = mongoose.model('Order',orderSchema);


module.exports.Order = Order;