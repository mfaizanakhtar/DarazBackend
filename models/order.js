const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    OrderId:String,
    OrderItemId:String,
    ShopId:String,
    Name:String,
    Sku:String,
    ShopSku:String,
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


    
})

const Order = mongoose.model('Order',orderSchema);

module.exports.Order = Order;