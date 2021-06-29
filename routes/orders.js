const mongoose = require('mongoose');
const express = require('express');
const { Order } = require('../models/order');
const auth = require('../middleware/auth')
const router = express.Router();

router.get('/:status',auth,async(req,res)=>{
    var response
    console.log(req.query.OrderId)

    if(req.params.status=='all'){
        response = await FindQuery({},req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='ready_to_ship'){
        response = await aggregateQuery({"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":{$ne:"Dispatched"}},req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='RTS-Dispatched'){
        response = await aggregateQuery(aggregateDoc("RTSDispatched",req.query.OrderId),req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='Delivery Failed-Received'){
        response = await aggregateQuery(aggregateDoc("DeliveryFailedReceived"),req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='Claimable'){
        response = await aggregateQuery(aggregateDoc("Claimable"),req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='Claim Filed'){
        response = await aggregateQuery(aggregateDoc("ClaimFiled"),req.query.pageNumber,req.query.pageSize)
    }
    else if(req.params.status=='Claim Received'){
        response = await aggregateQuery(aggregateDoc("ClaimReceived"),req.query.pageNumber,req.query.pageSize)
    }
    else{
        response = await FindQuery({Statuses:req.params.status},req.query.pageNumber,req.query.pageSize)
    }
    res.send(response);
})

function aggregateDoc(status,OrderId){
    date = new Date();
    date.setDate(date.getDate()-30);
    RTSDispatched = {"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":"Dispatched"}
    DeliveryFailedReceived = {"OrderItems.Status":"delivery failed","OrderItems.WarehouseStatus":"Received"}
    Claimable = {CreatedAt: {$lte:date},"OrderItems.WarehouseStatus":"Dispatched","OrderItems.Status":{$ne:"delivered"}}
    ClaimFiled = {$or:[{"OrderItems.WarehouseStatus":"Claim Filed"},{"OrderItems.WarehouseStatus":"Claim Approved"},{"OrderItems.WarehouseStatus":"Claim Rejected"},{"OrderItems.WarehouseStatus":"Claim POD Dispute"}]}
    ClaimReceived = {"OrderItems.WarehouseStatus":"Claim Received"}

    if(status=="RTSDispatched"){
        if(!OrderId) return RTSDispatched
        RTSDispatched.OrderId=OrderId
        return RTSDispatched
    }
    else if(status=="DeliveryFailedReceived"){
        if(!OrderId) return DeliveryFailedReceived
        DeliveryFailedReceived.OrderId=OrderId
        return DeliveryFailedReceived
    }
    else if(status=="Claimable"){
        if(!OrderId) return Claimable
        Claimable.OrderId=OrderId
        return Claimable
    }
    else if(status=="ClaimFiled"){
        if(!OrderId) return ClaimFiled
        ClaimFiled.OrderId=OrderId
        return ClaimFiled
    }
    else if(status=="ClaimReceived"){
        if(!OrderId) return ClaimReceived
        ClaimReceived.OrderId=OrderId
        return ClaimReceived
    }
}


async function FindQuery(FilterDoc,pNumber,pSize){
    console.log(FilterDoc)
    const length = await Order.countDocuments(FilterDoc)

    const orders = await Order.find(FilterDoc)
    .populate('OrderItems')
    .sort({CreatedAt:-1})
    .skip(parseInt(pNumber*pSize))
    .limit(parseInt(pSize))

    return [orders,length]
}

async function aggregateQuery(filterDoc,pNumber,pSize){
        console.log(filterDoc)
        //join then find
        const orders = await Order.aggregate([
            {$lookup:{
                from:'orderitems',
                localField:"OrderItems",
                foreignField:"_id",
                as:"OrderItems"
            }},
            {$match:filterDoc}
        ])
        .skip(parseInt(pNumber*pSize))
        .limit(parseInt(pSize))

        const length = await Order.aggregate([
            {$lookup:{
                from:'orderitems',
                localField:"OrderItems",
                foreignField:"_id",
                as:"OrderItems"
            }},
            {$match:filterDoc},
            {$count:"count"}
        ])
        
        if(length[0]) return [orders,length[0].count]
        return [orders,0]
}

router.get('/data/:filter',async(req,res)=>{
    //join then find
    const orders = await Order.aggregate([
        {$lookup:{
            from:'orderitems',
            localField:"OrderItems",
            foreignField:"_id",
            as:"orderitems"
        }},
        {$match:{
            "orderitems.TrackingCode":'PK-DEX013223201'
        }}
    ])
    res.send(...orders)
})

module.exports = router