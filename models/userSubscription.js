const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    loginemail:String,
    expiry:{type:Date,default:() => Date.now() + 7*24*60*60*1000},
    type:String
})

const UserSubsciprtion = new mongoose.model('userSubscription',subscriptionSchema);

module.exports.UserSubsciprtion = UserSubsciprtion;