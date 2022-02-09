const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Billing } = require('../models/billing');

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


module.exports.billings = router