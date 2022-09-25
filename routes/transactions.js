const express = require('express');
const router = express.Router()
const {Transaction} = require('../models/transaction');
const auth = require('../middleware/auth');
const {getDateFilterTransactions} = require('../service/utils');

router.get('/',auth,async(req,res)=>{
    var query = req.query
    console.log(query)
    var pageSize = req.query.pSize
    var pageIndex = req.query.Pindex

    // startdate = new Date(query.startDate);
    // startdate.setHours(startdate.getHours()-5);
    // enddate = new Date(query.endDate);
    // enddate.setHours(enddate.getHours()+18,59,59,59);
    var dateFilter = getDateFilterTransactions(query)
    
    for(var propName in query){
        if(query[propName]=="null" || propName=="startDate" || propName=="endDate" || propName=="pSize" || propName=="pIndex"){
            delete query[propName]
        }
    }

    var Filter =    {
        userEmail:req.user.userEmail,
        $and:[{TransactionDate:{$gte:dateFilter.startDate}},{TransactionDate:{$lte:dateFilter.endDate}}],
        ...query
    }

    var Transactions = await Transaction.find(Filter)
    .skip(parseInt(pageSize)*parseInt(pageIndex))
    .limit(parseInt(pageSize))

    var DropDownVal = await getAggregatedValues(req,Filter)

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
            $match:{userEmail:req.user.userEmail,...query}
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
            $match:{userEmail:req.user.userEmail}
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
            $match:{userEmail:req.user.userEmail,ShopName:{$ne:null}}
        },
        {
            $group:{_id:"$ShopName"}
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
            $match:{userEmail:req.user.userEmail}
        },
        {
            $group:{_id:"$TransactionType"}
        }])
    
        var FeeName = await Transaction.aggregate([
            {
                $match:{userEmail:req.user.userEmail,TransactionType:req.query.TransactionType}
            },
            {
                $group:{_id:"$FeeName"}
            }])
    
        var Stores = await Transaction.aggregate([
            {
                $match:{userEmail:req.user.userEmail}
            },
            {
                $group:{_id:"$ShopName"}
            }])
        
        var Statements = await Transaction.aggregate([
            {
                $match:{userEmail:req.user.userEmail}
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
                $group:{_id:"$userEmail",Sum:{$sum:"$Amount"}}
            }
        ])
        console.log(Sum)
        return {Length:Length,TransactionType:TransactionType,FeeName:FeeName,Store:Stores,Statements:Statements,TotalBalance:Sum}
}

module.exports=router;