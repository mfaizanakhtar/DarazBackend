const mongoose = require('mongoose');
const constants = require('../data/constants');


const userSubscriptionSchema = new mongoose.Schema({
    userEmail:{type:String,unique:true},
    subscriptionType:{type:String,default:constants.TRIAL_PERMISSIONS_LOOKUP},
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