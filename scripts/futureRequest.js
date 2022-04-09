const { UserSubscription } = require("../models/userSubscription");
const moment = require('moment');
const { Lookup } = require("../models/lookup");
const { User } = require("../models/user");


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

            var {lookup_detail:newPermissions} =await Lookup.findOne({lookup_key:futureReq.subscription})
            var user = await User.findOne({loginemail:updateResult.userEmail});
            if(user.permissions){
                for(var perm in newPermissions){
                    user.permissions.hasOwnProperty(perm) ? user.permissions[perm] = newPermissions[perm] : ""
                }
            }else user.permissions=newPermissions;
            await user.save();
        }else if(moment().isBefore(subscription.futureRequest.startDate)){
            console.log("future request not eligible")
        }
    }
}

module.exports.upgradeFuturePackage = upgradeFuturePackage;