const mongoose = require('mongoose');

const previousOrderSchema = new mongoose.Schema({
    ShopId:String,
    OrdersData:mongoose.Schema.Types.Mixed
})


const previousOrder = new mongoose.model('previousOrder',previousOrderSchema);

module.exports.previousOrder = previousOrder;