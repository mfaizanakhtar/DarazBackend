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
    sellerId:String
})

const Shop = mongoose.model('Shop',ShopSchema);

module.exports.Shop = Shop;

