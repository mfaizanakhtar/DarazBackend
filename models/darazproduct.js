const mongoose = require('mongoose')

const darazProductSchema = new mongoose.Schema({
    PrimaryCategory:Number,
    ItemId:Number,
    Attributes:mongoose.Schema.Types.Mixed,
    Skus:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'darazSku'
    }],
    createdTime:Date,
    updatedTime:Date,
    ShopShortCode:String,
    userEmail:String

}
)

const darazProduct = mongoose.model('darazProduct',darazProductSchema)
module.exports.darazProduct=darazProduct