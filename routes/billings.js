const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Billing } = require('../models/billing');
const { Lookup } = require('../models/lookup');
const { User } = require('../models/user');
const { UserSubscription } = require('../models/userSubscription');
const moment = require('moment');
const constants = require('../data/constants');

router.get('/getAllTransactions',auth,async(req,res)=>{
    console.log(req.user)
    filter = req.user.userType=='admin' ? {} : {userEmail:req.user.userEmail}
    var billings = await Billing.find(filter).skip(req.query.pNum*req.query.pSize).limit(req.query.pSize)
    res.status(200).send(billings);
})

router.post('/addTransaction',auth,async(req,res)=>{
    const billing = new Billing({
        billingId:await Billing.find().countDocuments()+1,
        createdAt:new Date(),
        userEmail:req.user.userEmail,
        subscriptionType:req.body.subscriptionType,
        duration:req.body.duration,
        durationType:req.body.durationType,
        billingMethod:req.body.billingMethod,
        isFutureRequest:req.body.isFutureRequest,
        invoiceAmount:req.body.invoiceAmount,
        bankDetail:req.body.bankDetail,
        transactionId:req.body.transactionId,
        screenShot:req.body.screenShot
    })
    if(req.body.billingMethod=='1'){
        billing.paymentUrl=constants.BANK_TRANSFER_URL;
    }else if(req.body.billingMethod=='2'){
        billing.paymentUrl=constants.EASYPAISA_URL;
    }

    const savedBilling = await billing.save();

    res.status(201).send({billingId:savedBilling.billingId,redirectUrl:billing.paymentUrl})
})

router.put('/confirmTransaction',auth,async(req,res)=>{
    //update transaction
    console.log(req.body)
    var updateResult = await Billing.findOneAndUpdate({_id:req.body.transactionId},{status:req.body.status})
    if(req.body.status=='completed' && updateResult){
        //update subscription
        var userSubscription = await UserSubscription.findOne({userEmail:updateResult.userEmail})
        if(updateResult.isFutureRequest && userSubscription){
                var endDate = moment(userSubscription.endDate).add(updateResult.duration,'month')
                userSubscription.futureRequest.val=true
                userSubscription.futureRequest.subscription=updateResult.subscriptionType
                userSubscription.futureRequest.startDate = userSubscription.endDate
                userSubscription.futureRequest.endDate=endDate
            await userSubscription.save()
            var permLookup =await Lookup.findOne({lookup_key:updateResult.subscriptionType})
            await User.updateOne({loginemail:updateResult.userEmail},{permissions:permLookup.lookup_detail})
        }else if(userSubscription){
                var endDate = moment().add(updateResult.duration,'month')
                userSubscription.subscriptionType=updateResult.subscriptionType
                userSubscription.startDate=new Date()
                userSubscription.endDate=endDate
            await userSubscription.save()
            var {lookup_detail:newPermissions} =await Lookup.findOne({lookup_key:updateResult.subscriptionType})
            var user = await User.findOne({loginEmail:updateResult.userEmail});
            if(user.permissions){
                for(var perm in newPermissions){
                    user.permissions.hasOwnProperty(perm) ? user.permissions[perm] = newPermissions[perm] : ""
                }
            }else user.permissions=newPermissions;
            await user.save();
            // await User.updateOne({loginemail:updateResult.userEmail},{permissions:permLookup.lookup_detail})
        }

        //update permisisions


    }


    // console.log(updateResult)
    if(updateResult) res.status(201).send({status:"updated"})
    else res.status(500).send({status:"error occured"})

})

router.get('/getSubscriptionDetail',auth,async(req,res)=>{
    var userSubscription = await UserSubscription.findOne({userEmail:req.user.userEmail})
    res.send(userSubscription)
})

router.put('/cancelFutureRequest',auth,async(req,res)=>{
    var userSubscription = await UserSubscription.findOne({userEmail:req.user.userEmail})
    if(userSubscription && userSubscription.futureRequest.val){
        userSubscription.futureRequest={val:false}
        await userSubscription.save()
        res.status(200).send({status:'canceled'})
    }else{
        res.status(200).send({status:'failure'})
    }

})

router.put('/updateBTBillingTransaction/:billingId',auth,async(req,res)=>{
    var updateStatus = await Billing.updateOne({billingId:req.params.billingId},
        {bankDetail:req.body.bankDetail,transactionId:req.body.transactionId,screenShot:req.body.screenShot,status:req.body.status})

    if(updateStatus.nModified>0) return res.status(200).send({message:"submitted successfully"})
    else return res.status(500).send({message:"internal error occured"})
})


module.exports.billings = router