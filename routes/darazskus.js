const express = require('express');
const router = express.Router()
const auth = require('../middleware/auth')
const {darazSku} = require('../models/darazsku')
const { OrderItems } = require('../models/orderItem')
const { Sku } = require('../models/sku');
const { updatePriceQuantity } = require('../service/darazSkuService');
const { getShopsWithUserEmail } = require('../service/shopService');


router.get('/getSkus',auth,async(req,res)=>{
    let pSize=parseInt(req.query.pSize)
    let pIndex=parseInt(req.query.pIndex)
    let StockFilter={}

    for(let key in req.query){
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
    let darazskus = await darazSku.find({userEmail:req.user.userEmail,...req.query,...StockFilter}).sort({updatedAt:-1})
    .skip(pSize*pIndex)
    .limit(pSize)

    let darazskusCount=await darazSku.countDocuments({userEmail:req.user.userEmail,...req.query,...StockFilter})
 
    let darazStores=await getShopsWithUserEmail(req.user.userEmail);


    res.send({darazskus:darazskus,darazskusCount:darazskusCount,darazStores:darazStores})


})

router.delete('/:id',auth,async(req,res)=>{
    let deleteResult = await darazSku.deleteMany({_id:req.params.id,userEmail:req.user.userEmail})
    res.send({DeleteResult:deleteResult})
})

router.put('/:id',auth,async(req,res)=>{
    let result = await darazSku.findOneAndUpdate(
        {_id:req.params.id,userEmail:req.user.userEmail},

        {
            cost:req.body.cost,
            FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost  
        }
        )
        await OrderItems.updateMany({ShopSku:result.ShopSku,cost:0,ShippingType:"Own Warehouse"},
            {cost:req.body.cost,packagingCost:req.body.FBDpackagingCost})

        await OrderItems.updateMany({ShopSku:result.ShopSku,cost:0,ShippingType:"Dropshipping"},
            {cost:req.body.cost,packagingCost:req.body.FBMpackagingCost})

    res.send({updatedResult:result})
})

router.put('/updatePriceQuantity/:id',auth,async(req,res)=>{
    try{
        let response = await updatePriceQuantity(req.params.id,req.user.userEmail,req.body)
        res.status(200).send(response)
    }catch(ex){
        return res.status(400).send(ex)
    }
})

module.exports = router