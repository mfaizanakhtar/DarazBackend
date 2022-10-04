const mongoose = require('mongoose');
const constants = require('../data/constants');


const userSubscriptionSchema = new mongoose.Schema({
    userEmail:String,
    subscriptionType:{type:String,default:constants.trialPermisLookup},
    startDate:Date,
    endDate:Date,
    futureRequest:{
        val:{type:Boolean,default:false},
        subscription:String,
        startDate:Date,
        endDate:Date
    }
})

const UserSubscription = new mongoose.model('UserSubscription',userSubscriptionSchema);

module.exports.UserSubscription = UserSubscription;