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
    UpdatedTracking:String,
    ShippingProviderType:String,
    CreatedAt:Date,
    UpdatedAt:Date,
    productMainImage:String,
    Variation:String,
    DispatchDate:Date,
    ReturnDate:Date,
    useremail:String,
    Transactions:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaction'
    }],
    cost:Number


    
})

const OrderItems = mongoose.model('OrderItem',OrderItemsSchema);

module.exports.OrderItems = OrderItems;