const express = require('express');
const { Plan } = require('../models/plan');
const router = express.Router();


router.get('/getAllPlans',async (req,res)=>{
    var plans = await Plan.find();
    res.status(200).send(plans);
})

module.exports.plans = router;