const express = require('express');
const router = express.Router()
const auth = require('../middleware/auth')
const {darazSku} = require('../models/darazsku')


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
        if(req.query[key]=='null' || key=='pSize' || key=='pIndex' || key=='Stock')
        delete req.query[key] 
    }

    var darazskus = await darazSku.find({useremail:req.user.useremail,...req.query,...StockFilter}).sort({quantity:-1})
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
        {
            
            $inc:{"FBMstock.quantity":req.body.FBMchange,"FBDstock.quantity":req.body.FBDchange},
            cost:req.body.cost,
            FBDpackagingCost:req.body.FBDpackagingCost,FBMpackagingCost:req.body.FBMpackagingCost
                
        }
        )

    res.send({updatedResult:result})
})

module.exports = router