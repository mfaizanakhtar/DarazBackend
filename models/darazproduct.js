const mongoose = require('mongoose')

const darazProductSchema = new mongoose.Schema({
    PrimaryCategory:Number,
    ItemId:Number,
    Attributes:{
    name:String,
    short_description:String,
    description:String,
    brand:String,
    description_en:String,
    short_description_en:String,
    name_en:String,
    source:String
    },
    Skus:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'darazSku'
    }],
    ShopId:String,
    useremail:String

}
)

const darazProduct = mongoose.model('darazProduct',darazProductSchema)
module.exports.darazProduct=darazProduct