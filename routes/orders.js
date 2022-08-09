const express = require('express');
const { Order } = require('../models/order');
const {OrderItems} = require('../models/orderItem')
const auth = require('../middleware/auth')
const router = express.Router();
const {Shop} = require('../models/shop')
const {RtsURL} = require('../scripts/GenerateUrl')
const {GetData} = require('../scripts/HttpReq')
const {updateOrderItemsForRts,fetchLabelsAndUpdate,updateOrderItemStatus} = require('../scripts/updateStatus')
const {getDateFilter,updateQuery, updateQueryForStockChecklist} = require('../service/ordersService')

router.get('/orders/',auth,async(req,res)=>{

    var response = await FindQuery(req.query,req.user)
    var stores = await Order.aggregate([{$match:{useremail:req.user.userEmail}},
        {$group:{_id:"$ShopId"}}
    ])

    res.send([...response,stores]);
})


async function FindQuery(query,user){
    // console.log(query)

    var skuSort=[]
    var shopSort=[]
    var isPrinted={}
    
    if(query.Printed=="true") isPrinted={isPrinted:true}
    if(query.unPrinted=="true") isPrinted={isPrinted:false}

    dateFilter=getDateFilter(query);
    updateQueryResult = updateQuery(query);

    query = updateQueryResult.query;
    var pageArgs=updateQueryResult.pageArgs
    var FinalFilter=updateQueryResult.FinalFilter

    //check if sort is true, set Skus sort to 1 to enable sorting by sku
    // if(query.skuSort=="true") skuSort=[{$sort:{"Skus":1}}]
    // if(query.shopSort=="true") shopSort=[{$sort:{"ShopId":1}}]

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
    // console.log("here",orders)
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
        var shop = await Shop.findOne({shopid:order.ShopId})
        // console.log(shop)
        for(var orderitem of order.OrderItems){
            if(orderitem.ShippingType=='Dropshipping' && orderitem.Status!='canceled') {
                OrderItems=OrderItems+orderitem.OrderItemId+','
            }
        }
        OrderItems=OrderItems+']'
        Url = RtsURL(shop.shopid,shop.secretkey,OrderItems)
        var result = await GetData(Url)
        RtsOrdersResponse.push(result)
    }
    // console.log(RtsOrdersResponse.length)
    var updateResult = false
    if(Orders.length==RtsOrdersResponse.length){
    updateResult = await updateOrderItemsForRts(req.user.userEmail,RtsOrdersResponse.length)
    console.log(updateResult)
    }
    res.send({count:RtsOrdersResponse.length,updateResult:updateResult})

}
catch(error){
    console.log(error)
    res.send({count:0})
}

    // DarazIds = Shop.findOne({shopid:req.user.userEmail})
})

router.post('/setItemStatusToRTS',auth,async(req,res)=>{
    // console.log(req.body.OrderItem)
    RtsOrdersResponse=[]
    OrderItem = req.body.OrderItem
    var shop = await Shop.findOne({shopid:OrderItem.ShopId})
    try{

    Url = RtsURL(shop.shopid,shop.secretkey,"["+OrderItem.OrderItemId+"]")
    var result = await GetData(Url)
    RtsOrdersResponse.push(result)
    console.log(RtsOrdersResponse.length)
    updateResult = await updateOrderItemsForRts(req.user.userEmail,RtsOrdersResponse.length)
    await OrderItems.updateMany({OrderItemId:OrderItem.OrderItemId},{SeperateRts:true})
    res.send({count:RtsOrdersResponse.length,updateResult:updateResult})

}
catch(error){
    console.log(error)
    res.send({count:0})
}

    // DarazIds = Shop.findOne({shopid:req.user.userEmail})
})

router.post('/getLabelsData',auth,async(req,res)=>{
    // var LabelOrders
    var skuSort={}
    var shopSort={}
    // console.log(req.body.shopSort)
    // console.log(req.body)
    if(req.body.skuSort==true) {
        skuSort={"Skus":1}
    }
    if(req.body.shopSort==true) {
        shopSort={"ShopId":1}
    }
    console.log("skuSort",skuSort)
    console.log("shopSort",shopSort)
    // console.log(sort)
    // var updateResult=true
    var updateResult = await updateOrderItemStatus({useremail:req.user.userEmail,},{Status:'ready_to_ship',ShippingType:'Dropshipping'})
    if(updateResult==true) await fetchLabelsAndUpdate(req.user.userEmail)
    await Order.updateMany({OrderId:{$in:req.body.Orders}},{$set:{isPrinted:true}})
    trackingCount = await OrderItems.aggregate([{$match:{OrderId:{$in:req.body.Orders},ShippingType:'Dropshipping'}},{$group:{_id:'$TrackingCode',Count:{$sum:1}}}])

        Order.find({OrderId:{$in:req.body.Orders}}).sort({CreatedAt:1}).sort({...skuSort}).sort({...shopSort}).populate({path:'OrderItems',match:{ShippingType:'Dropshipping'}})
        .then((response)=>{
            res.send({labelsData:response,labelsCount:trackingCount})
        })
        .catch((error)=>{
            console.log(error)
            res.send({labelsData:[]})
        })

    
    // console.log(LabelOrders)
    
})

router.post('/getStockChecklist/:skuType',auth,async(req,res)=>{
    if(req.body.trackings!=undefined){
        var matchFilter = {$match:{TrackingCode:{$in:req.body.trackings},useremail:req.user.userEmail,ReturnedStockAdded:{$ne:true}}}
    }  
    else if(req.body.orders!=undefined && req.body.orders.length>0){
    var matchFilter = {$match:{OrderId:{$in:req.body.orders},ShippingType:"Dropshipping",useremail:req.user.userEmail}}
    }
    else{
    var matchFilter = {$match:{Status:"ready_to_ship",DispatchDate:null,ShippingType:"Dropshipping",useremail:req.user.userEmail}}
    }
    var result = await OrderItems.aggregate([
        matchFilter,
        {$group:{
            _id:"$"+req.params.skuType,
            count:{$sum:1},
            ReturnedStockAdded:{$first:"$ReturnedStockAdded"},
            img:{$first:"$productMainImage"}
        }},
        {$sort:{"_id":1}}
    ])
    res.send(result)
})

router.get('/getFilterStockChecklist',auth,async(req,res)=>{
    var query=req.query
    var user = req.user

    var isPrinted={}
    
    if(query.Printed=="true") isPrinted={isPrinted:true}
    if(query.unPrinted=="true") isPrinted={isPrinted:false}

    dateFilter=getDateFilter(query);
    updateQueryResult = updateQueryForStockChecklist(query);

    console.log(query)
    query = updateQueryResult.query;
    console.log(query)
    var FinalFilter=updateQueryResult.FinalFilter

    //spread the finalfilter,query,date and assign it to final filter
    FinalFilter = {...FinalFilter,...query,...dateFilter,useremail:user.useremail,...isPrinted}
    // console.log(FinalFilter)
    var matchFilter={$match:FinalFilter}

    var result = await OrderItems.aggregate([
        matchFilter,
        {$group:{
            _id:"$BaseSku",
            count:{$sum:1},
            // ReturnedStockAdded:{$first:"$ReturnedStockAdded"},
            img:{$first:"$productMainImage"}
        }},
        {$sort:{"_id":1}}
    ])
    console.log(result)
    res.send(result)
})

router.put("/updateClaim/:id",auth,async (req,res)=>{
    // console.log(req.body)
    // console.log(req.params)
    var result = await Order.findOneAndUpdate({_id:req.params.id},{ClaimNumber:req.body.ClaimNumber},{returnNewDocument:true})
    console.log(result)
    if(result==null){
        res.sendStatus(404).send({message:"Not Found"})
    }
    res.send(result)
})

module.exports = router