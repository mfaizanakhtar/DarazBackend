const express = require('express');
const router = express.Router()
const {Transaction} = require('../models/transaction');
const auth = require('../middleware/auth');

router.get('/',auth,async(req,res)=>{
    var query = req.query
    console.log(query)
    var pageSize = req.query.pSize
    var pageIndex = req.query.Pindex

    startdate = new Date(query.startDate);
    startdate.setHours(startdate.getHours()-5);
    enddate = new Date(query.endDate);
    enddate.setHours(enddate.getHours()+18,59,59,59);
    
    for(var propName in query){
        if(query[propName]=="null" || propName=="startDate" || propName=="endDate" || propName=="pSize" || propName=="pIndex"){
            delete query[propName]
        }
    }
    console.log(startdate)
    console.log(enddate)
    console.log(req.query)

    var Filter =    {
        useremail:req.user.userEmail,
        $and:[{TransactionDate:{$gte:startdate}},{TransactionDate:{$lte:enddate}}],
        ...query
    }

    var Transactions = await Transaction.find(Filter)
    .skip(parseInt(pageSize)*parseInt(pageIndex))
    .limit(parseInt(pageSize))

    var DropDownVal = await getAggregatedValues(req,Filter)
    // console.log(DropDownVal)

    res.send({Transactions:Transactions,...DropDownVal})
})

router.get('/Statement',auth,async(req,res)=>{
    var query = req.query
    for(var propName in query){
        if(query[propName]=="null"){
            delete query[propName]
        }
    }

    var Statement = await Transaction.aggregate([
        {
            $match:{useremail:req.user.userEmail,...query}
        },
        {
            $group:{_id:"$FeeName",Amount:{$sum:"$Amount"},Vat:{$sum:"$VATinAmount"}}
        }
    ])

    res.send({Statement:Statement})
})

router.get('/ViewStatementFilters',auth,async(req,res)=>{
    var Statements = await Transaction.aggregate([
        {
            $match:{useremail:req.user.userEmail}
        },
        {
            $group:{_id:"$Statement",Date:{$first:"$TransactionDate"}}
        },
        {
            $sort:{Date:-1}
        }
    ])

    var Stores = await Transaction.aggregate([
        {
            $match:{useremail:req.user.userEmail,ShopId:{$ne:null}}
        },
        {
            $group:{_id:"$ShopId"}
        },
        {
            $sort:{_id:1}
        }
        ])

    res.send({Statements:Statements,Stores:Stores})
})

async function getAggregatedValues(req,Filter){
    var Length = await Transaction.find(Filter).countDocuments()

    var TransactionType = await Transaction.aggregate([
        {
            $match:{useremail:req.user.userEmail}
        },
        {
            $group:{_id:"$TransactionType"}
        }])
    
        var FeeName = await Transaction.aggregate([
            {
                $match:{useremail:req.user.userEmail,TransactionType:req.query.TransactionType}
            },
            {
                $group:{_id:"$FeeName"}
            }])
    
        var Stores = await Transaction.aggregate([
            {
                $match:{useremail:req.user.userEmail}
            },
            {
                $group:{_id:"$ShopId"}
            }])
        
        var Statements = await Transaction.aggregate([
            {
                $match:{useremail:req.user.userEmail}
            },
            {
                $group:{_id:"$Statement",Date:{$first:"$TransactionDate"}}
            },
            {
                $sort:{Date:-1}
            }
        ])

        var Sum = await Transaction.aggregate([
            {
               $match:Filter 
            },
            {
                $sort:{TransactionDate:-1}
            },
            {
                $group:{_id:"$useremail",Sum:{$sum:"$Amount"}}
            }
        ])
        console.log(Sum)
        return {Length:Length,TransactionType:TransactionType,FeeName:FeeName,Store:Stores,Statements:Statements,TotalBalance:Sum}
}

module.exports=router;