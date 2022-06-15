const express = require('express');
const router = express.Router()
const auth = require('../middleware/auth')
const {darazSku} = require('../models/darazsku')
const { OrderItems } = require('../models/orderItem')
const { Sku } = require('../models/sku')


router.get('/getSkus',auth,async(req,res)=>{
    var pSize=parseInt(req.query.pSize)
    var pIndex=parseInt(req.query.pIndex)
    var StockFilter={}
    // console.log(req.query)

    for(var key in req.query){
        if(key=='Stock'){
            if(req.query.Stock=='InStock'){
                StockFilter={quantity:{$gte:0}}
            }
            else if(req.query.Stock=='OutOfStock'){
                StockFilter={quantity:{$lte:0}}
            }
        }
        if(req.query[key]=='null' || key=='pSize' || key=='pIndex' || key=='Stock') {delete req.query[key]} 
        else if(key=='ShopSku' || key=='SellerSku'){
            const regex = new RegExp(`${req.query[key]}`,'i')
            req.query[key] = regex
        }

    }
    var darazskus = await darazSku.find({useremail:req.user.useremail,...req.query,...StockFilter}).sort({updatedAt:-1})
    .skip(pSize*pIndex)
    .limit(pSize)

    var darazskusCount=await darazSku.countDocuments({useremail:req.user.useremail,...req.query,...StockFilter})
 
    var darazStores=await darazSku.aggregate([
        {
            $match:{useremail:req.user.useremail}
        },
        {
            $group:{_id:"$ShopId"}
        }
    ])


    res.send({darazskus:darazskus,darazskusCount:darazskusCount,darazStores:darazStores})


})

router.delete('/:id',auth,async(req,res)=>{
    var deleteResult = await darazSku.deleteMany({_id:req.params.id,useremail:req.user.useremail})
    res.send({DeleteResult:deleteResult})
})

router.put('/:id',auth,async(req,res)=>{
    // console.log(req.body)
    var result = await darazSku.findOneAndUpdate(
        {_id:req.params.id,useremail:req.user.useremail},
        // {
            
        //     $inc:{"FBMstock.quantity":req.body.FBMchange,"FBDstock.quantity":req.body.FBDchange},
        //     cost:req.body.cost,
        //     FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost
                
        // }
        {
            cost:req.body.cost,
            FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost  
        }
        )
        await OrderItems.updateMany({ShopSku:result.ShopSku,cost:0,ShippingType:"Own Warehouse"},
            {cost:req.body.cost,packagingCost:req.body.FBDpackagingCost})

        await OrderItems.updateMany({ShopSku:result.ShopSku,cost:0,ShippingType:"Dropshipping"},
            {cost:req.body.cost,packagingCost:req.body.FBMpackagingCost})

        // if(req.body.GroupSkuChangeStock!=0){
        //     console.log("BaseSku: "+result.BaseSku)
        //     var updateResult = await Sku.findOneAndUpdate({useremail:req.user.useremail,name:result.BaseSku},
        //         {$inc:{FBMstock:req.body.GroupSkuChangeStock}})
        //     console.log(updateResult)
        // }

    res.send({updatedResult:result})
})

module.exports = router