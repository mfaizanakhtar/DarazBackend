const express = require('express')
const router = express.Router();
const {OrderItems} = require('../models/orderItem');
const {Order}=require('../models/order')
const auth = require("../middleware/auth")
const moment = require('moment')

router.get('/OrderStatuses',auth,async (req,res)=>{
    var response=[]
    var statuses=['pending','ready_to_ship','shipped','delivered','returned','failed']
    for (var status of statuses) {
        jsonStatus={status:status}
        jsonStatus.count= await getStatus({Status:status},req.user.useremail,req.query)
        response.push(jsonStatus)
        
    }
    var extraStatuses=[{label:'failed-Not Received',Status:'failed',ReturnDate:null,ShippingType:'Dropshipping'}]
    for (var s of extraStatuses){
        jsonStatus={status:s.label}
        var query={}
        for(const prop in s){
            if(prop!='label')
            query[prop]=s[prop]
        }
        jsonStatus.count= await getStatus(query,req.user.useremail,req.query)
        response.push(jsonStatus)
    }
    console.log(response)

    res.send(response)
})

router.get('/OrderAnalytics',auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    console.log('StartDate: '+startdate)
    enddate=moment(req.query.startdate).endOf('day').tz("Asia/Karachi").toDate()
    console.log('EndDate: '+enddate)
    var response=[]
    var itemsResult = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:"$OrderItemId"}},
        {$count:"sum"}
    ])

    var ordersResult = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:"$OrderId"}},
        {$count:"sum"}
    ])

    var revenueResult = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:null,sum:{$sum:"$ItemPrice"}}}
    ])
    if(itemsResult.length==0){
        itemsResult.push({sum:0})
        ordersResult.push({sum:0})
        revenueResult.push({sum:0})
    }

    response={orders:ordersResult[0].sum,items:itemsResult[0].sum,revenue:revenueResult[0].sum}
    // console.log(response)
    res.send(response)

})

router.get("/OrdersAnalyticsGraph",auth,async(req,res)=>{
    // var aggregateTime={ $dayOfYear: "$CreatedAt"}
    // var daydifference = (enddate-startdate)/(1000*60*60*24)
    // var monthdifference = (enddate-startdate)/(1000*60*60*24*30)
    // var yeardifference = (enddate-startdate)/(1000*60*60*24*30*12)
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    storeFilter={}
    skuFilter={}
    matchFilter={useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    if(req.query.store!=null) matchFilter={...matchFilter,ShopId:req.query.store}
    if(req.query.sku!=null) matchFilter={...matchFilter,Sku:req.query.sku}

    var itemsGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:{ $dayOfYear: "$CreatedAt"},revenue:{$sum:"$ItemPrice"},items:{$sum:1},day:{$first:{$dayOfMonth:"$CreatedAt"}},month:{$first:{$month:"$CreatedAt"}},year:{$first:{$year:"$CreatedAt"}}}},
        {$sort:{"_id":1}}
    ])

    var ordersGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:"$OrderId",CreatedAt:{$first:"$CreatedAt"}}},
        {$group:{_id:{ $dayOfYear: "$CreatedAt"},orders:{$sum:1},day:{$first:{$dayOfMonth:"$CreatedAt"}},month:{$first:{$month:"$CreatedAt"}},year:{$first:{$year:"$CreatedAt"}}}},
        {$sort:{"_id":1}}
    ])
    console.log(ordersGraphQuery)

    var itemsResponse={name:"Items",type:"line",data:[]}
    var ordersResponse={name:"Orders",type:"line",data:[]}
    var revenueResponse={name:"Revenue",type:"line",data:[]}
    var labels=[]
    for(let i=0;i<ordersGraphQuery.length;i++){
        if(itemsGraphQuery.length>i) itemsResponse.data.push(itemsGraphQuery[i].items)
        if(ordersGraphQuery.length>i) ordersResponse.data.push(ordersGraphQuery[i].orders)
        if(itemsGraphQuery.length>i) revenueResponse.data.push(itemsGraphQuery[i].revenue)
        labels.push(itemsGraphQuery[i].day+"-"+itemsGraphQuery[i].month+"-"+itemsGraphQuery[i].year)
    }


    // console.log(revenueData)
    var responseData=[]
    if(req.query.o=='true') responseData.push(ordersResponse)
    if(req.query.i=='true') responseData.push(itemsResponse)
    if(req.query.r=='true') responseData.push(revenueResponse)
    res.send({Data:responseData,Labels:labels})
})

router.get("/getStoreOrdersDetail",auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    var orderitems = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:"$ShopId",items:{$sum:1},revenue:{$sum:"$ItemPrice"}}
        },
        {
            $sort:{"revenue":-1}
        }
])

    // var orders = await OrderItems.aggregate([
    //     {$match:{useremail:req.user.useremail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
    //     {
    //         $group:{_id:"$ShopId",orders:{$sum:1}}
    //     }
    // ])

    var orders = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId",ShopId:{$first:"$ShopId"}}
        },
        {
            $group:{_id:"$ShopId",orders:{$sum:1}}
        }
    ])

    var response=[]

    for(var items of orderitems){
        for(var order of orders){
            if (items._id == order._id){
                response.push({store:items._id,orders:order.orders,items:items.items,revenue:items.revenue})
            } 
        }
    }
    
    // console.log(response)
    res.send({StoreDetail:response})
})

router.get("/getStoreSkuDetails",auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    var SkuItems=await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},ShopId:req.query.store,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
         $group:{_id:"$Sku",count:{$sum:1},revenue:{$sum:"$ItemPrice"}}   
        },
        {
            $sort:{"revenue":-1}
        }
    ])
    
    var SkuOrders=await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},ShopId:req.query.store,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
         $group:{_id:{sku:"$Sku",orders:"$OrderId"},count:{$sum:1}}   
        },
        {
            $group:{_id:"$_id.sku",count:{$sum:1}}
        }
    ])

    var SkuItemsFulfillment=await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},ShopId:req.query.store,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:{sku:"$Sku",Fulfillment:"$ShippingType"},count:{$sum:1}}
        }
    ])
    // console.log(SkuItemsFulfillment)
    var SkuItemsTotal=await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,Status:{$ne:'canceled'},ShopId:req.query.store,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:"$ShippingType",count:{$sum:1}}
        }
    ])

    var response=[]
    var ItemsFulfillmentTotal={Dropshipping:0,OwnWarehouse:0}

    for(items of SkuItemsTotal){
        if(items._id=='Dropshipping') ItemsFulfillmentTotal.Dropshipping=items.count
        else if(items._id=='Own Warehouse') ItemsFulfillmentTotal.OwnWarehouse=items.count
    }

    for(var items of SkuItems){
        for(var orders of SkuOrders){
            if(items._id==orders._id){
                var fulfillmentObj={}

                for(var fulfillment of SkuItemsFulfillment){
                    if(fulfillment._id.sku==items._id){
                        if(fulfillment._id.Fulfillment=='Dropshipping') fulfillmentObj={...fulfillmentObj,Dropshipping:fulfillment.count}
                        else fulfillmentObj={...fulfillmentObj,OwnWarehouse:fulfillment.count}
                    }
                }

                response.push({sku:items._id,orders:orders.count,items:items.count,revenue:items.revenue,...fulfillmentObj})
            }
        }
    }

    // console.log({SkuDetail:response,SkuTotal:ItemsFulfillmentTotal})
    res.send({SkuDetail:response,SkuTotal:ItemsFulfillmentTotal})
})

router.get("/getProfitAnalytics",auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    itemsProfit = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,items:{$sum:1},sales:{$sum:"$ItemPrice"},costs:{$sum:"$cost"},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:["$TransactionsPayout","$cost"]}}}
        }
    ])

    OrdersProfit = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:{OrderId:"$OrderId",OrderItemId:"$OrderItemId"}}
        },
        {
            $group:{_id:"$_id.OrderId"}
        },
        {
            $count:"orders"
        }
    ])

    // console.log(itemsProfit)
    res.send({ProfitStats:{...itemsProfit[0],...OrdersProfit[0]}})
})

router.get("/getProfitAnalyticsGraph",auth,async(req,res)=>{
    // var aggregateTime={ $dayOfYear: "$CreatedAt"}
    // var daydifference = (enddate-startdate)/(1000*60*60*24)
    // var monthdifference = (enddate-startdate)/(1000*60*60*24*30)
    // var yeardifference = (enddate-startdate)/(1000*60*60*24*30*12)
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    storeFilter={}
    skuFilter={}
    matchFilter={useremail:req.user.useremail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    if(req.query.store!=null) matchFilter={...matchFilter,ShopId:req.query.store}
    if(req.query.sku!=null) matchFilter={...matchFilter,Sku:req.query.sku}

    var itemsGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {
        $group:{
                _id:{ $dayOfYear: "$CreatedAt"},
                revenue:{$sum:"$ItemPrice"},costs:{$sum:"$cost"},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:["$TransactionsPayout","$cost"]}},items:{$sum:1},
                day:{$first:{$dayOfMonth:"$CreatedAt"}},month:{$first:{$month:"$CreatedAt"}},year:{$first:{$year:"$CreatedAt"}}
                }
        },
        {$sort:{"_id":1}}
    ])

    var ordersGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:"$OrderId",CreatedAt:{$first:"$CreatedAt"}}},
        {$group:{_id:{ $dayOfYear: "$CreatedAt"},orders:{$sum:1},day:{$first:{$dayOfMonth:"$CreatedAt"}},month:{$first:{$month:"$CreatedAt"}},year:{$first:{$year:"$CreatedAt"}}}},
        {$sort:{"_id":1}}
    ])

    var itemsResponse={name:"Items",type:"line",data:[]}
    var ordersResponse={name:"Orders",type:"line",data:[]}
    var revenueResponse={name:"Revenue",type:"line",data:[]}
    var profitResponse={name:"Profit",type:"line",data:[]}
    var labels=[]
    for(let i=0;i<ordersGraphQuery.length;i++){

        if(itemsGraphQuery.length>i) itemsResponse.data.push(itemsGraphQuery[i].items)
        if(ordersGraphQuery.length>i) ordersResponse.data.push(ordersGraphQuery[i].orders)
        if(itemsGraphQuery.length>i) revenueResponse.data.push(itemsGraphQuery[i].revenue.toFixed(0))
        if(itemsGraphQuery.length>i) profitResponse.data.push(itemsGraphQuery[i].profit.toFixed(0))
        labels.push(itemsGraphQuery[i].day+"-"+itemsGraphQuery[i].month+"-"+itemsGraphQuery[i].year)
    }


    var responseData=[]
    if(req.query.o=='true') responseData.push(ordersResponse)
    if(req.query.i=='true') responseData.push(itemsResponse)
    if(req.query.r=='true') responseData.push(revenueResponse)
    if(req.query.p=='true') responseData.push(profitResponse)

    console.log(responseData)
    res.send({Data:responseData,Labels:labels})
})

router.get("/getStoresProfitStats",auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    items = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$ShopId",items:{$sum:1},sales:{$sum:"$ItemPrice"},costs:{$sum:{$add:["$cost","$packagingCost"]}},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:[{$subtract:["$TransactionsPayout","$cost"]},"$packagingCost"]}}}
        },
        {
            $sort:{"profit":-1}
        }
    ])

    Orders = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId",ShopId:{$first:"$ShopId"}}
        },
        {
            $group:{_id:"$ShopId",orders:{$sum:1}}
        }
    ])

    var response=[]

    for(item of items){
        for(order of Orders){
            if(order._id==item._id){
                response.push({...item,orders:order.orders})
            }
        }
    }

    // console.log(response)
    res.send(response)
})

router.get('/getStoreSkuProfitStats',auth,async(req,res)=>{
    startdate=moment(req.query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(req.query.enddate).endOf('day').tz("Asia/Karachi").toDate()

    Skuitems = await OrderItems.aggregate([
        {
            $match:{useremail:req.user.useremail,Status:"delivered",ShopId:req.query.store,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$Sku",items:{$sum:1},sales:{$sum:"$ItemPrice"},costs:{$sum:{$add:["$cost","$packagingCost"]}},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:[{$subtract:["$TransactionsPayout","$cost"]},"$packagingCost"]}}}
        },
        {
            $sort:{"profit":-1}
        }
    ])

    // console.log(Skuitems)
    res.send(Skuitems)
})

async function getStatus(filter,useremail,query){
    // console.log(query.startdate)
    startdate=moment(query.startdate).startOf('day').tz("Asia/Karachi").toDate()
    enddate=moment(query.enddate).endOf('day').tz("Asia/Karachi").toDate()
    var items = await OrderItems.aggregate([
        {
            $match:{...filter,useremail:useremail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderItemId"}
        },
        {
            $count:"ItemCount"
        }
    ])

    var orders = await OrderItems.aggregate([
        {
            $match:{...filter,useremail:useremail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId"}
        },
        {
            $count:"OrderCount"
        }
    ])

    var sales = await OrderItems.aggregate([
        {
            $match:{...filter,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,sales:{$sum:"$ItemPrice"}}
        }
    ])
    if(sales[0]) delete sales[0]['_id']
    // console.log(sales[0])
    if(items.length==0) items.push({ItemCount:0})
    if(orders.length==0) orders.push({OrderCount:0})
    if(sales.length==0) sales.push({sales:0})
    var response={...items[0],...orders[0],...sales[0]}
    return response
}

module.exports = router