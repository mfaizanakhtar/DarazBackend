const mongoose = require('mongoose')


const darazSkuSchema=new mongoose.Schema({
        Status:String,
        quantity:Number,
        _compatible_variation_:String,
        Images:[String],
        SellerSku:String,
        ShopSku:{type:String,unique:true},
        package_content:String,
        Url:String,
        multiWarehouseInventories:[
        {
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            warehouseCode:String,
            sellableQuantity: Number
        }],
        package_width:String,
        color_family: String,
        package_height: Number,
        fblWarehouseInventories:[ 
        {
            occupyQuantity: Number,
            quantity: Number,
            totalQuantity: Number,
            withholdQuantity: Number,
            warehouseCode:String,
            sellableQuantity: Number
        }],
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
        cost:{
            type:Number,
            default:0
        },
        FBMpackagingCost:{
            type:Number,
            default:0
        },
        FBDpackagingCost:{
            type:Number,
            default:0
        },
        GroupSku:String,
        ShopShortCode:String,
        ShopName:String,
        userEmail:String,
        itemId:Number,
        BaseSku:String,
        updatedAt:{
            type:Date,
            default:new Date()
        }

})

const darazSku = mongoose.model('darazSku',darazSkuSchema)
module.exports.darazSku=darazSku