const mongoose = require('mongoose');


const OrderItemsSchema = new mongoose.Schema({
    OrderId:String,
    OrderItemId:{type:String,unique:true},
    ShopShortCode:String,
    ShopName:String,
    Name:String,
    Sku:String,
    ShopSku:String,
    BaseSku:String,
    ShippingType:String,
    ItemPrice:Number,
    ShippingAmount:Number,
    Status:String,
    WarehouseStatus:String,
    TrackingCode:String,
    PreviousTracking:String,
    SlaTimeStamp:Date,
    labelTracking:{type:String,default:''},
    SeperateRts:{type:Boolean,default:false},
    ShippingProviderType:String,
    ShipmentProvider:String,
    CreatedAt:Date,
    UpdatedAt:Date,
    productMainImage:String,
    productDetailUrl:String,
    Currency:String,
    Variation:String,
    DispatchDate:{type:Date,default:''},
    ReturnDate:Date,
    userEmail:String,
    Transactions:[{
        _id:{ type:mongoose.Schema.Types.ObjectId,ref:'Transaction' },
        TransactionType:String,
        FeeName:String,
        Amount:Number,
        VATinAmount:Number,
        Statement:String

    }],
    TransactionsPayout:{type:Number,default:0},
    PayoutCycle:String,
    cost:Number,
    packagingCost:Number,
    PortCode:{type:String,defaults:''},
    trackingBarcode:String,
    portcodeBarcode:String,
    orderIdBarcode:String,
    qrCode:String,
    labelPrice:String,
    deliveryPoint:String,
    sellerAddress:String,
    Reason:String,
    trackingChangeCount:{
        type:Number,
        default:0
    },
    ReceiveBy:String,
    DispatchBy:String



    
})

const OrderItems = mongoose.model('OrderItem',OrderItemsSchema);

module.exports.OrderItems = OrderItems;