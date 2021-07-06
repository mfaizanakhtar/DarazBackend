const mongoose = require('mongoose');
const express = require('express');
const { Order } = require('../models/order');
const auth = require('../middleware/auth')
const router = express.Router();
const {Darazid} = require('../models/darazid')
const {RtsURL} = require('../scripts/GenerateUrl')
const {GetData} = require('../scripts/HttpReq')
const {updateOrderItemUserWise,fetchLabelsAndUpdate,updateOrderItemStatusAndUserWise} = require('../scripts/updateStatus')

router.get('/orders/',auth,async(req,res)=>{

    var response = await FindQuery(req.query,req.user)
    var stores = await Order.aggregate([
        {$group:{_id:"$ShopId"}}
    ])

    res.send([...response,stores]);
})


async function FindQuery(query,user){
    
    var pageArgs={}
    var FinalFilter={}
    dateFilter={$and:[{CreatedAt:{$gte:new Date(query.startDate)}},{CreatedAt:{$lte:new Date(query.endDate)}}]}
    
    AdditionStatus={
        RTSDispatched : {"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":"Dispatched"},
        DeliveryFailedReceived : {"OrderItems.Status":"delivery failed","OrderItems.WarehouseStatus":"Received"},
        Claimable : {CreatedAt: {$lte:date},"OrderItems.WarehouseStatus":"Dispatched","OrderItems.Status":{$ne:"delivered"}},
        ClaimFiled : {$or:[{"OrderItems.WarehouseStatus":"Claim Filed"},{"OrderItems.WarehouseStatus":"Claim Approved"},{"OrderItems.WarehouseStatus":"Claim Rejected"},{"OrderItems.WarehouseStatus":"Claim POD Dispute"}]},
        ClaimReceived : {"OrderItems.WarehouseStatus":"Claim Received"}
    }

    if(AdditionStatus[query["OrderItems.Status"]]){
        if(query["OrderItems.Status"]=="Claimable") dateFilter={}

        FinalFilter={...AdditionStatus[query["OrderItems.Status"]]}
        query["OrderItems.Status"]="null"
    } 
    
    for(var propName in query){
        if(query[propName] == "null" || propName=="startDate" || propName=="endDate") 
        delete query[propName]
        else if(propName=="pageSize" || propName=="pageNumber")
        {
            pageArgs={...pageArgs,[propName]:query[propName]}
            delete query[propName]
        }
    }
    

    FinalFilter = {...FinalFilter,...query,...dateFilter,useremail:user.useremail}
    // console.log(FinalFilter)

    const orders = await Order.aggregate([
        {
            $match:{}
        },
        {$lookup:{
            from:'orderitems',
            localField:"OrderItems",
            foreignField:"_id",
            as:"OrderItems"
        }},
        {$match:FinalFilter}
    ])
    .skip(parseInt(pageArgs.pageNumber*pageArgs.pageSize))
    .limit(parseInt(pageArgs.pageSize))

    const length = await Order.aggregate([
        {$lookup:{
            from:'orderitems',
            localField:"OrderItems",
            foreignField:"_id",
            as:"OrderItems"
        }},
        {$match:FinalFilter},
        {$count:"count"}
    ])
    if(length[0]) return [orders,length[0].count]
    return [orders,0]
}

router.post('/setStatusToRTS',auth,async(req,res)=>{
    // console.log(req.body.Orders.length)
    RtsOrdersResponse=[]
    Orders = req.body.Orders
    var shop
    try{
    for(var order of Orders){
        // console.log(order)
        var OrderItems='['
        var shop = await Darazid.findOne({shopid:order.ShopId})
        // console.log(shop)
        for(var orderitem of order.OrderItems){
            if(orderitem.ShippingType=='Dropshipping') {
                OrderItems=OrderItems+orderitem.OrderItemId+','
            }
        }
        OrderItems=OrderItems+']'
        Url = RtsURL(shop.shopid,shop.secretkey,OrderItems)
        var result = await GetData(Url)
        RtsOrdersResponse.push(result)
    }
    // console.log(RtsOrdersResponse.length)
    await updateOrderItemUserWise(req.user.useremail,RtsOrdersResponse.length)
    res.send({count:RtsOrdersResponse.length})

}
catch(error){
    console.log(error)
    res.send({count:0})
}

    // DarazIds = Darazid.findOne({shopid:req.user.useremail})
})

router.post('/getLabelsData',auth,async(req,res)=>{
    // var LabelOrders
    await updateOrderItemStatusAndUserWise(req.user.useremail,'ready_to_ship')
    await fetchLabelsAndUpdate(req.user.useremail)

        Order.find({OrderId:{$in:req.body.Orders}}).populate({path:'OrderItems',match:{ShippingType:'Dropshipping'}})
        .then((response)=>{
            res.send(response)
        })
        .catch((error)=>{
            console.log(error)
        })

    
    // console.log(LabelOrders)
    
})

// router.get('/statusstats',async(req,res)=>{
//     //join then find
//     var result = await Order.aggregate([
//         {$group : { _id: '$Statuses', Count : {$sum : 1}}}
//     ])
//     res.send(result)
// })

// router.get('/skustats',async(req,res)=>{
//     //join then find
//     var result = await Order.aggregate([
//         {$group : { _id: '$BaseSkus', Count : {$sum : 1}}}
//     ])
//     console.log(result)
//     res.send(result)
// })

module.exports = router