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
        useremail:req.user.useremail,
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

async function getAggregatedValues(req,Filter){
    var Length = await Transaction.find(Filter).countDocuments()

    var TransactionType = await Transaction.aggregate([
        {
            $match:{useremail:req.user.useremail}
        },
        {
            $group:{_id:"$TransactionType"}
        }])
    
        var FeeName = await Transaction.aggregate([
            {
                $match:{useremail:req.user.useremail,TransactionType:req.query.TransactionType}
            },
            {
                $group:{_id:"$FeeName"}
            }])
    
        var Stores = await Transaction.aggregate([
            {
                $match:{useremail:req.user.useremail}
            },
            {
                $group:{_id:"$ShopId"}
            }])
        
        var Statements = await Transaction.aggregate([
            {
                $match:{useremail:req.user.useremail}
            },
            {
                $sort:{"TransactionDate":1}
            },
            {
                $group:{_id:"$Statement"}
            }])

        var Sum = await Transaction.aggregate([
            {
               $match:Filter 
            },
            {
                $sort:{"TransactionDate":-1}
            },
            {
                $group:{_id:"$useremail",Sum:{$sum:"$Amount"}}
            }
        ])
        console.log(Sum)
        return {Length:Length,TransactionType:TransactionType,FeeName:FeeName,Store:Stores,Statements:Statements,TotalBalance:Sum}
}

module.exports=router;