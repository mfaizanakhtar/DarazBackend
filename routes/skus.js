const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { OrderItems } = require('../models/orderItem');
const {Sku} = require('../models/sku');
const {darazSku} = require('../models/darazsku')


router.get('/getAllSkus',auth,async (req,res)=>{
    var skus = await Sku.find({useremail:req.user.userEmail})
    .skip(parseInt(req.query.pageIndex)*parseInt(req.query.pageSize))
    .limit(parseInt(req.query.pageSize))

    var skusLength = await Sku.countDocuments({useremail:req.user.userEmail})
    res.send({skus:skus,skusLength:skusLength})
})

router.post('/updateSku',auth,async(req,res)=>{
    await OrderItems.updateMany({useremail:req.user.userEmail,BaseSku:req.body.name,cost:0,ShippingType:"Dropshipping"},
    {cost:req.body.cost,packagingCost:req.body.FBMpackagingCost})

    await OrderItems.updateMany({useremail:req.user.userEmail,BaseSku:req.body.name,cost:0,ShippingType:"Own Warehouse"},
    {cost:req.body.cost,packagingCost:req.body.FBDpackagingCost})

    await darazSku.updateMany({useremail:req.user.userEmail,BaseSku:req.body.name},{
        cost:req.body.cost,FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost
    })

    var result = await Sku.findOneAndUpdate(
        {name:req.body.name,useremail:req.user.userEmail},
        {$inc:{FBMstock:req.body.stockChange},cost:req.body.cost,
        FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost}
        )

    // console.log(result)

    res.send({updatedResult:result})
})

router.delete('/:id',auth,async(req,res)=>{
    // console.log(req.body)
    var deleteResult = await Sku.deleteMany({_id:req.params.id,useremail:req.user.userEmail})
    res.send({DeleteResult:deleteResult})

})

router.post('/AddReturnedStock',auth,async(req,res)=>{
    for(var stock of req.body.stock){
        await Sku.findOneAndUpdate({useremail:req.user.userEmail,name:stock._id},{$inc:{FBMstock:stock.count}})
    }
    res.send({Status:"Stock Updated"})
})

module.exports = router