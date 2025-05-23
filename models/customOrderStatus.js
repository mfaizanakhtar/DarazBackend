const mongoose = require('mongoose')

const customOrderSchema = mongoose.Schema({
    statusName:{type:String,unique:true},
    userEmail:String,
    statusMongoQuery:mongoose.Schema.Types.Mixed,
    isMarkable:{type:Boolean,default:false},
    hasDateRange:{type:Boolean,default:false},
    statusArray:[{
        filterType:String,
        filterName:String,
        isNot:Boolean,
        displayedVal:String,
        value:mongoose.Schema.Types.Mixed
    }]

})

const CustomOrderStatus = mongoose.model('CustomOrderStatus',customOrderSchema);

module.exports.CustomOrderStatus = CustomOrderStatus;