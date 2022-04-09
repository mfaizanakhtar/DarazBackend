const { UserSubscription } = require("../models/userSubscription");
const moment = require('moment');


async function upgradeFuturePackage(){
    var subscriptions = await UserSubscription.find({"futureRequest.val":true});
    for(var subscription of subscriptions){
        if(moment().isAfter(subscription.futureRequest.startDate)){
            var futureReq = subscription.futureRequest
            subscription.endDate=futureReq.endDate;
            subscription.startDate=futureReq.startDate;
            subscription.subscriptionType=futureReq.subscription
            subscription.futureRequest={val:false}
            subscription.save()
        }else if(moment().isBefore(subscription.futureRequest.startDate)){
            console.log("future request not eligible")
        }
    }
}

module.exports.upgradeFuturePackage = upgradeFuturePackage;