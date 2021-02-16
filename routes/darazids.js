const express = require('express');
const router = express.Router();
const { Darazid } = require('../models/darazid');


router.post('/',async(req,res)=>{
    const darazid = new Darazid({
        emailid:req.body.emailid,
        secretkey:req.body.secretkey
    })

    await darazid.save();
    res.send({message:"ID ADDED"});
})

router.get('/',async(req,res)=>{
    const darazids =await Darazid.find();
    res.send(darazids);
})

module.exports = router;