const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { OrderItems } = require('../models/orderItem');
const {Sku} = require('../models/sku');


router.get('/getAllSkus',auth,async (req,res)=>{
    var skus = await Sku.find({useremail:req.user.useremail})
    .skip(parseInt(req.query.pageIndex)*parseInt(req.query.pageSize))
    .limit(parseInt(req.query.pageSize))

    var skusLength = await Sku.countDocuments({useremail:req.user.useremail})
    res.send({skus:skus,skusLength:skusLength})
})

router.post('/updateSku',auth,async(req,res)=>{
    await OrderItems.updateMany({useremail:req.user.useremail,BaseSku:req.body.name,cost:0},{cost:req.body.cost})
    var result = await Sku.findOneAndUpdate({name:req.body.name,useremail:req.user.useremail},
        {$inc:{FBMstock:req.body.stockChange},cost:req.body.cost})

    // console.log(result)

    res.send({updatedResult:result})
})

module.exports = router