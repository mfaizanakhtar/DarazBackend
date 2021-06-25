const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Darazid } = require('../models/darazid');


router.post('/',auth,async(req,res)=>{
    const darazid = new Darazid({
        shopid:req.body.shopid,
        secretkey:req.body.secretkey,
        useremail:req.user.useremail
    })

    await darazid.save();
    res.send({message:"ID ADDED"});
})

router.get('/',async(req,res)=>{
    const darazids =await Darazid.find();
    res.send(darazids);
})

module.exports = router;