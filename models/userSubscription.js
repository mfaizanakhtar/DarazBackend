const mongoose = require('mongoose')


const userSubscriptionSchema = new mongoose.Schema({
    userEmail:String,
    subscriptionType:{type:String,default:null},
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