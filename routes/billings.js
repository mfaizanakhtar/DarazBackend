const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Billing } = require('../models/billing');
const { Lookup } = require('../models/lookup');
const { User } = require('../models/user');
const { UserSubscription } = require('../models/userSubscription');
const moment = require('moment')

router.get('/getAllTransactions',auth,async(req,res)=>{
    filter = req.user.usertype=='admin' ? {} : {userEmail:req.user.useremail}
    var billings = await Billing.find(filter).skip(req.query.pNum*req.query.pSize).limit(req.query.pSize)
    res.status(200).send(billings);
})

router.post('/addTransaction',auth,async(req,res)=>{
    var billing = new Billing({
        billingId:await Billing.find().count()+1,
        createdAt:new Date(),
        userEmail:req.user.useremail,
        subscriptionType:req.body.subscriptionType,
        duration:req.body.duration,
        durationType:req.body.durationType,
        pricing:req.body.pricing,
        invoiceAmount:req.body.invoiceAmount,
        bankDetail:req.body.bankDetail,
        transactionId:req.body.transactionId
    })

    var savedBilling = await billing.save()
    res.status(201).send({billingId:savedBilling.billingId})
})

router.put('/confirmTransaction',auth,async(req,res)=>{
    //update transaction
    console.log(req.body)
    var updateResult = await Billing.findOneAndUpdate({_id:req.body.transactionId},{status:req.body.status})
    if(req.body.status=='approved' && updateResult){
        //update subscription
        var userSubscription = await UserSubscription.findOne({userEmail:updateResult.userEmail})
        var endDate = moment().add(updateResult.duration,'month')
        if(userSubscription){
            userSubscription.subscriptionType=updateResult.subscriptionType
            userSubscription.startDate=new Date()
            userSubscription.endDate=endDate
        }
        await userSubscription.save()
        //update permisisions
        var permLookup =await Lookup.findOne({lookup_key:updateResult.subscriptionType})
        var updatedUser = await User.updateOne({loginemail:updateResult.userEmail},{permissions:permLookup.lookup_detail})

    }


    // console.log(updateResult)
    if(updateResult) res.status(201).send({status:"updated"})
    else res.status(500).send({status:"error occured"})

})

router.get('/getSubscriptionDetail',auth,async(req,res)=>{
    var userSubscription = await UserSubscription.findOne({userEmail:req.user.useremail})
    res.send(userSubscription)
})


module.exports.billings = router