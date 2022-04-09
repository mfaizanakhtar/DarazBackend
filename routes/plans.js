const express = require('express');
const { Plan } = require('../models/plan');
const router = express.Router();


router.get('/getAllPlans',async (req,res)=>{
    var plans = await Plan.find();
    res.status(200).send(plans);
})

router.get('/getPlan/:planName',async(req,res)=>{
    var plan = await Plan.findOne({Name:req.params.planName})
    res.status(200).send(plan)
})

module.exports.plans = router;