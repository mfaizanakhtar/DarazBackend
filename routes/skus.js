const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const {Sku} = require('../models/sku');


router.get('/getAllSkus',auth,async (req,res)=>{
    var skus = await Sku.find({useremail:req.user.useremail})
    res.send(skus)
})

module.exports = router