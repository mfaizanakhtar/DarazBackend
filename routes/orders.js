const mongoose = require('mongoose');
const express = require('express');
const { Order } = require('../models/order');
const {OrderItems} = require('../models/orderItem')
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

    var startdate;
    var enddate;
    var skuSort=[]
    var shopSort=[]
    var isPrinted={}
    //setting timezone startdate and enddate
    async function timezone(){
    
    startdate = new Date(query.startDate);
    startdate.setHours(startdate.getHours()+5);
    enddate = new Date(query.endDate);
    enddate.setHours(enddate.getHours()+28,59,59,59);

    }
    await timezone();
    console.log(startdate)
    console.log(enddate)
    //initializing filters object variables
    var pageArgs={}
    var FinalFilter={}
    dateFilter={$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    //check if sort is true, set Skus sort to 1 to enable sorting by sku
    if(query.skuSort=="true") skuSort=[{$sort:{"Skus":1}}]
    if(query.shopSort=="true") shopSort=[{$sort:{"ShopId":1}}]

    if(query.Printed=="true") isPrinted={isPrinted:true}
    if(query.unPrinted=="true") isPrinted={isPrinted:false}
        
    
    
    AdditionStatus={
        ready_to_ship:{"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":{$ne:"Dispatched"}},
        RTSDispatched : {"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":"Dispatched"},
        DeliveryFailedReceived : {"OrderItems.Status":"delivery failed","OrderItems.WarehouseStatus":"Received"},
        Claimable : {CreatedAt: {$lte:date},"OrderItems.WarehouseStatus":"Dispatched","OrderItems.Status":{$ne:"delivered"}},
        ClaimFiled : {$or:[{"OrderItems.WarehouseStatus":"Claim Filed"},{"OrderItems.WarehouseStatus":"Claim Approved"},{"OrderItems.WarehouseStatus":"Claim Rejected"},{"OrderItems.WarehouseStatus":"Claim POD Dispute"}]},
        ClaimReceived : {"OrderItems.WarehouseStatus":"Claim Received"}
    }
    //removing datefilter if status = claimaible
    if(AdditionStatus[query["OrderItems.Status"]]){
        if(query["OrderItems.Status"]=="Claimable") dateFilter={}
        //if status found from additionstatus, delete orderitems.status
        FinalFilter={...AdditionStatus[query["OrderItems.Status"]]}
        query["OrderItems.Status"]="null"
    } 
    //iterate the query object
    for(var propName in query){//if value is null,startdate or enddate, delete the object key value
        if(query[propName] == "null" || propName=="startDate" || propName=="endDate" || propName=="skuSort" || propName=="shopSort" || propName=="Printed" || propName=="unPrinted") 
        delete query[propName]//if pagesize or page number, move to pageArgs object and delete that from query
        else if(propName=="pageSize" || propName=="pageNumber")
        {
            pageArgs={...pageArgs,[propName]:query[propName]}
            delete query[propName]
        }
    }
    
    //spread the finalfilter,query,date and assign it to final filter
    FinalFilter = {...FinalFilter,...query,...dateFilter,useremail:user.useremail,...isPrinted}
    // console.log(FinalFilter)
    //query generated
    const orders = await Order.aggregate([
        {
            $match:{useremail:user.useremail,...dateFilter}
        },
        {$lookup:{
            from:'orderitems',
            localField:"OrderItems",
            foreignField:"_id",
            as:"OrderItems"
        }},
        {$match:FinalFilter},
        {$sort:{"CreatedAt":1}},
        ...skuSort,
        ...shopSort,
    ])
    .skip(parseInt(pageArgs.pageNumber*pageArgs.pageSize))
    .limit(parseInt(pageArgs.pageSize))
    //use for counting the documents
    const length = await Order.aggregate([
        {
            $match:{useremail:user.useremail,...dateFilter}
        },
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
    // console.log(req.body.Orders)
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

router.post('/setItemStatusToRTS',auth,async(req,res)=>{
    // console.log(req.body.OrderItem)
    RtsOrdersResponse=[]
    OrderItem = req.body.OrderItem
    var shop = await Darazid.findOne({shopid:OrderItem.ShopId})
    try{

    Url = RtsURL(shop.shopid,shop.secretkey,"["+OrderItem.OrderItemId+"]")
    var result = await GetData(Url)
    RtsOrdersResponse.push(result)
    console.log(RtsOrdersResponse.length)
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
    var skuSort={}
    var shopSort={}
    // console.log(req.body.shopSort)
    if(req.body.skuSort==true) {
        skuSort={"Skus":1}
    }
    if(req.body.shopSort==true) {
        shopSort={"ShopId":1}
    }
    console.log("skuSort",skuSort)
    console.log("shopSort",shopSort)
    // console.log(sort)
    await updateOrderItemStatusAndUserWise(req.user.useremail,'ready_to_ship')
    await fetchLabelsAndUpdate(req.user.useremail)
    await Order.updateMany({OrderId:{$in:req.body.Orders}},{$set:{isPrinted:true}})

        Order.find({OrderId:{$in:req.body.Orders}}).sort({CreatedAt:1}).sort({...skuSort}).sort({...shopSort}).populate({path:'OrderItems',match:{ShippingType:'Dropshipping'}})
        .then((response)=>{
            res.send(response)
        })
        .catch((error)=>{
            console.log(error)
            res.send([])
        })

    
    // console.log(LabelOrders)
    
})

router.post('/getStockChecklist',auth,async(req,res)=>{
    if(req.body.orders>0){
    var matchFilter = {$match:{OrderId:{$in:req.body.orders}}}
    }
    else{
    var matchFilter = {$match:{Status:"ready_to_ship",ShippingType:"Dropshipping"}}
    }
    var result = await OrderItems.aggregate([
        matchFilter,
        {$group:{
            _id:"$BaseSku",
            count:{$sum:1}
        }}
    ])
    res.send(result)
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