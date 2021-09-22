const mongoose = require('mongoose');


const OrderItemsSchema = new mongoose.Schema({
    OrderId:String,
    OrderItemId:String,
    ShopId:String,
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
    labelTracking:{type:String,default:''},
    SeperateRts:{type:Boolean,default:false},
    ShippingProviderType:String,
    ShipmentProvider:String,
    CreatedAt:Date,
    UpdatedAt:Date,
    productMainImage:String,
    Variation:String,
    DispatchDate:{type:Date,default:''},
    ReturnDate:Date,
    useremail:String,
    Transactions:[{
        _id:{ type:mongoose.Schema.Types.ObjectId,ref:'Transaction' },
        TransactionType:String,
        FeeName:String,
        Amount:Number,
        VATinAmount:Number,
        Statement:String

    }],
    cost:Number,
    packagingCost:Number,
    PortCode:{type:String,default:''},
    trackingBarcode:String,
    portcodeBarcode:String,
    orderIdBarcode:String,
    qrCode:String,
    labelPrice:String,
    deliveryPoint:String,
    trackingChangeCount:{
        type:Number,
        default:0
    },
    ReturnedStockAdded:{
        type:Boolean,
        default:false
    }



    
})

const OrderItems = mongoose.model('OrderItem',OrderItemsSchema);

module.exports.OrderItems = OrderItems;