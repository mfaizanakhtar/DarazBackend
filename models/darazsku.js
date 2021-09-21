const mongoose = require('mongoose')


const darazSkuSchema=new mongoose.Schema({
        Status:String,
        quantity:Number,
        localQuantity:Number,
        _compatible_variation_:String,
        Images:[String],
        SellerSku:String,
        ShopSku:String,
        package_content:String,
        Url:String,
        multiWarehouseInventories:
        {
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            sellableQuantity: Number
        },
        package_width:String,
        color_family: String,
        package_height: Number,
        fblWarehouseInventories: 
        {
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            sellableQuantity: Number
        },
        special_price: Number,
        price: Number,
        package_length: Number,
        special_from_date: String,
        special_from_time: String,
        special_time_format: String,
        package_weight: Number,
        SkuId: String,
        special_to_date: String,
        special_to_time: String,
        FBDstock:{
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            sellableQuantity: Number
        },
        FBMstock:{
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            sellableQuantity: Number
        },
        cost:Number,
        FBMpackagingCost:{
            type:Number,
            default:0
        },
        FBDpackagingCost:{
            type:Number,
            default:0
        },
        GroupSku:String,
        ShopId:String,
        useremail:String,
        BaseSku:String

})

const darazSku = mongoose.model('darazSku',darazSkuSchema)
module.exports.darazSku=darazSku