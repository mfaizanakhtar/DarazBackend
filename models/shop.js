const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
    userEmail:String,
    accessToken:String,
    tokenExpiresIn:Date,
    refreshToken:String,
    refreshExpiresIn:Date,
    country:String,
    account:String,
    accountPlatform:String,
    sellerId:String,
    nameCompany:String,
    logoUrl:String,
    verified:Boolean,
    name:String,
    location:String,
    email:String,
    status:String,
    shortCode:String,
    appStatus:{type:Boolean,default:true}

})

const Shop = mongoose.model('Shop',ShopSchema);

module.exports.Shop = Shop;

