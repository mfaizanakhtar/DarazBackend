const express = require('express')
const router = express.Router();
const {OrderItems} = require('../models/orderItem');
const {Order}=require('../models/order')
const auth = require("../middleware/auth")
const moment = require('moment')

router.get('/OrderStatuses',auth,async (req,res)=>{
    let response=[]
    let statuses=['pending','ready_to_ship','shipped','delivered','returned','failed']
    for (var status of statuses) {
        jsonStatus={status:status}
        jsonStatus.count= await getStatus({Status:status},req.user.userEmail,req.query)
        response.push(jsonStatus)
        
    }
    let extraStatuses=[{label:'failed-Not Received',Status:'failed',ReturnDate:null,ShippingType:'Dropshipping'}]
    for (var s of extraStatuses){
        jsonStatus={status:s.label}
        var query={}
        for(const prop in s){
            if(prop!='label')
            query[prop]=s[prop]
        }
        jsonStatus.count= await getStatus(query,req.user.userEmail,req.query)
        response.push(jsonStatus)
    }
    console.log(response)

    res.send(response)
})

router.get('/OrderAnalytics',auth,async(req,res)=>{
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()
    console.log(startdate)
    console.log(enddate)
    let response=[]
    let itemsResult = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:"$OrderItemId"}},
        {$count:"sum"}
    ])

    let ordersResult = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:"$OrderId"}},
        {$count:"sum"}
    ])

    let revenueResult = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:null,sum:{$sum:"$ItemPrice"}}}
    ])

    let packagingCostResult = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:null,sum:{$sum:"$cost"}}}
    ])

    let productCostResult = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {$group:{_id:null,sum:{$sum:"$packagingCost"}}}
    ])
    if(itemsResult.length==0){
        itemsResult.push({sum:0})
        ordersResult.push({sum:0})
        revenueResult.push({sum:0})
        packagingCostResult.push({sum:0})
        productCostResult.push({sum:0})

    }

    response={orders:ordersResult[0].sum,items:itemsResult[0].sum,revenue:revenueResult[0].sum,costs:productCostResult[0].sum,packagingCosts:packagingCostResult[0].sum}
    // console.log(response)
    res.send(response)

})

router.get("/OrdersAnalyticsGraph",auth,async(req,res)=>{
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()
    
    let matchFilter={userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    if(req.query.shopShortCode!=null) matchFilter={...matchFilter,ShopShortCode:req.query.shopShortCode}
    if(req.query.sku!=null) matchFilter={...matchFilter,Sku:req.query.sku}

    let itemsGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:{ $dayOfYear: {date:"$CreatedAt",timezone:"+0500"}},revenue:{$sum:"$ItemPrice"},items:{$sum:1},day:{$first:{$dayOfMonth:{date:"$CreatedAt",timezone:"+0500"}}},month:{$first:{$month:{date:"$CreatedAt",timezone:"+0500"}}},year:{$first:{$year:{date:"$CreatedAt",timezone:"+0500"}}}}},
        {$sort:{"_id":1}}
    ])

    let ordersGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:"$OrderId",CreatedAt:{$first:"$CreatedAt"}}},
        {$group:{_id:{ $dayOfYear: {date:"$CreatedAt",timezone:"+0500"}},orders:{$sum:1},day:{$first:{$dayOfMonth:{date:"$CreatedAt",timezone:"+0500"}}},month:{$first:{$month:{date:"$CreatedAt",timezone:"+0500"}}},year:{$first:{$year:{date:"$CreatedAt",timezone:"+0500"}}},order:{$first:"$OrderItemId"}}},
        {$sort:{"_id":1}}
    ])
    console.log(ordersGraphQuery)

    let itemsResponse={name:"Items",type:"line",data:[]}
    let ordersResponse={name:"Orders",type:"line",data:[]}
    let revenueResponse={name:"Revenue",type:"line",data:[]}
    let labels=[]
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
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let orderitems = await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:"$ShopShortCode",items:{$sum:1},revenue:{$sum:"$ItemPrice"},shopName:{$first:"$ShopName"}}
        },
        {
            $sort:{"revenue":-1}
        }
])

    let orders = await OrderItems.aggregate([
        {
            $match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId",ShopShortCode:{$first:"$ShopShortCode"}}
        },
        {
            $group:{_id:"$ShopShortCode",orders:{$sum:1}}
        }
    ])

    let response=[]

    for(let items of orderitems){
        for(let order of orders){
            if (items._id == order._id){
                response.push({store:items.shopName,shopShortCode:items._id,orders:order.orders,items:items.items,revenue:items.revenue})
            } 
        }
    }
    
    // console.log(response)
    res.send({StoreDetail:response})
})

router.get("/getStoreSkuDetails",auth,async(req,res)=>{
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let SkuItems=await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},ShopShortCode:req.query.shortCode,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
         $group:{_id:"$Sku",count:{$sum:1},revenue:{$sum:"$ItemPrice"}}   
        },
        {
            $sort:{"revenue":-1}
        }
    ])
    
    let SkuOrders=await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},ShopShortCode:req.query.shortCode,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
         $group:{_id:{sku:"$Sku",orders:"$OrderId"},count:{$sum:1}}   
        },
        {
            $group:{_id:"$_id.sku",count:{$sum:1}}
        }
    ])

    let SkuItemsFulfillment=await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},ShopShortCode:req.query.shortCode,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:{sku:"$Sku",Fulfillment:"$ShippingType"},count:{$sum:1}}
        }
    ])
    // console.log(SkuItemsFulfillment)
    let SkuItemsTotal=await OrderItems.aggregate([
        {$match:{userEmail:req.user.userEmail,Status:{$ne:'canceled'},ShopShortCode:req.query.shortCode,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}},
        {
            $group:{_id:"$ShippingType",count:{$sum:1}}
        }
    ])

    let response=[]
    let ItemsFulfillmentTotal={Dropshipping:0,OwnWarehouse:0}

    for(let items of SkuItemsTotal){
        if(items._id=='Dropshipping') ItemsFulfillmentTotal.Dropshipping=items.count
        else if(items._id=='Own Warehouse') ItemsFulfillmentTotal.OwnWarehouse=items.count
    }

    for(let items of SkuItems){
        for(let orders of SkuOrders){
            if(items._id==orders._id){
                let fulfillmentObj={}

                for(let fulfillment of SkuItemsFulfillment){
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
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let itemsProfit = await OrderItems.aggregate([
        {
            $match:{userEmail:req.user.userEmail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,items:{$sum:1},sales:{$sum:"$ItemPrice"},packagingCosts:{$sum:"$packagingCost"},costs:{$sum:"$cost"},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:["$TransactionsPayout",{$subtract:["$cost","$packagingCost"]}]}}}
        }
    ])

    // let OrdersProfit = await OrderItems.aggregate([
    //     {
    //         $match:{userEmail:req.user.userEmail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    //     },
    //     {
    //         $group:{_id:"$OrderId"}
    //     },
    //     {
    //         $count:"orders"
    //     }
    // ])

    // console.log(itemsProfit)
    res.send({ProfitStats:{...itemsProfit[0]}})
})

router.get("/getProfitAnalyticsGraph",auth,async(req,res)=>{
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let matchFilter={userEmail:req.user.userEmail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    if(req.query.shortCode!=null) matchFilter={...matchFilter,ShopShortCode:req.query.shortCode}
    if(req.query.sku!=null) matchFilter={...matchFilter,Sku:req.query.sku}

    let itemsGraphQuery= await OrderItems.aggregate([
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

    let ordersGraphQuery= await OrderItems.aggregate([
        {$match:matchFilter},
        {$group:{_id:"$OrderId",CreatedAt:{$first:"$CreatedAt"}}},
        {$group:{_id:{ $dayOfYear: "$CreatedAt"},orders:{$sum:1},day:{$first:{$dayOfMonth:"$CreatedAt"}},month:{$first:{$month:"$CreatedAt"}},year:{$first:{$year:"$CreatedAt"}}}},
        {$sort:{"_id":1}}
    ])

    let itemsResponse={name:"Items",type:"line",data:[]}
    let ordersResponse={name:"Orders",type:"line",data:[]}
    let revenueResponse={name:"Revenue",type:"line",data:[]}
    let profitResponse={name:"Profit",type:"line",data:[]}
    let labels=[]
    for(let i=0;i<ordersGraphQuery.length;i++){

        if(itemsGraphQuery.length>i) itemsResponse.data.push(itemsGraphQuery[i].items)
        if(ordersGraphQuery.length>i) ordersResponse.data.push(ordersGraphQuery[i].orders)
        if(itemsGraphQuery.length>i) revenueResponse.data.push(itemsGraphQuery[i].revenue.toFixed(0))
        if(itemsGraphQuery.length>i) profitResponse.data.push(itemsGraphQuery[i].profit.toFixed(0))
        labels.push(itemsGraphQuery[i].day+"-"+itemsGraphQuery[i].month+"-"+itemsGraphQuery[i].year)
    }


    let responseData=[]
    if(req.query.o=='true') responseData.push(ordersResponse)
    if(req.query.i=='true') responseData.push(itemsResponse)
    if(req.query.r=='true') responseData.push(revenueResponse)
    if(req.query.p=='true') responseData.push(profitResponse)

    console.log(responseData)
    res.send({Data:responseData,Labels:labels})
})

router.get("/getStoresProfitStats",auth,async(req,res)=>{
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let items = await OrderItems.aggregate([
        {
            $match:{userEmail:req.user.userEmail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$ShopShortCode",ShopName:{$first:"$ShopName"},items:{$sum:1},sales:{$sum:"$ItemPrice"},costs:{$sum:{$add:["$cost","$packagingCost"]}},payout:{$sum:"$TransactionsPayout"},profit:{$sum:{$subtract:[{$subtract:["$TransactionsPayout","$cost"]},"$packagingCost"]}}}
        },
        {
            $sort:{"profit":-1}
        }
    ])

    let Orders = await OrderItems.aggregate([
        {
            $match:{userEmail:req.user.userEmail,Status:"delivered",$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId",ShopShortCode:{$first:"$ShopShortCode"}}
        },
        {
            $group:{_id:"$ShopShortCode",ShopName:{$first:"$ShopName"},orders:{$sum:1}}
        }
    ])

    let response=[]

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
    let startdate=moment(req.query.startdate).toDate()
    let enddate=moment(req.query.enddate).toDate()

    let Skuitems = await OrderItems.aggregate([
        {
            $match:{userEmail:req.user.userEmail,Status:"delivered",ShopShortCode:req.query.shortCode,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
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

async function getStatus(filter,userEmail,query){
    let startdate=moment(query.startdate).toDate()
    let enddate=moment(query.enddate).toDate()
    let items = await OrderItems.aggregate([
        {
            $match:{...filter,userEmail:userEmail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderItemId"}
        },
        {
            $count:"ItemCount"
        }
    ])

    let orders = await OrderItems.aggregate([
        {
            $match:{...filter,userEmail:userEmail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:"$OrderId"}
        },
        {
            $count:"OrderCount"
        }
    ])

    let sales = await OrderItems.aggregate([
        {
            $match:{...filter,userEmail:userEmail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,sales:{$sum:"$ItemPrice"}}
        }
    ])
    let costs = await OrderItems.aggregate([
        {
            $match:{...filter,userEmail:userEmail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,sales:{$sum:"$cost"}}
        }
    ])
    let packagingCosts = await OrderItems.aggregate([
        {
            $match:{...filter,userEmail:userEmail,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
        },
        {
            $group:{_id:null,sales:{$sum:"$packagingCost"}}
        }
    ])
    if(sales[0]) delete sales[0]['_id']
    // console.log(sales[0])
    if(items.length==0) items.push({ItemCount:0})
    if(orders.length==0) orders.push({OrderCount:0})
    if(sales.length==0) sales.push({sales:0})
    if(costs.length==0) costs.push({sales:0})
    if(packagingCosts.length==0) packagingCosts.push({sales:0})
    let response={...items[0],...orders[0],...sales[0],...costs[0],...packagingCosts[0]}
    return response
}

module.exports = router