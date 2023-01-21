const express = require('express');
const router = express.Router();
const { OrderItems } = require('../models/orderItem');
const {Sku} = require('../models/sku')
const auth = require('../middleware/auth')


router.put('/updateStatus/:Status',auth,async(req,res)=>{
    console.log(req.body)
    var dateArgs={}
    let statusToUpdate=req.params.Status;
        if(req.params.Status=='Dispatched'){
            dateArgs={DispatchDate:new Date(req.body.date)},
            Username={DispatchBy:req.user.username}
        }else if(req.params.Status=='Received'){
            dateArgs={ReturnDate:new Date(req.body.date)},
            Username={ReceiveBy:req.user.username}
        }
        else if(req.params.Status=='Reset Dispatched'){
            dateArgs={DispatchDate:null}
            statusToUpdate=null;
        }
        else if(req.params.Status=='Reset Received'){
            dateArgs={ReturnDate:null}
            statusToUpdate=null;
        }else if(req.params.Status='Reset'){
            statusToUpdate=null;
        }
        let updateBody={WarehouseStatus:statusToUpdate}
        if(Object.keys(dateArgs).length>0) updateBody={updateBody,...dateArgs}
        ordersUpdated = await OrderItems.updateMany({OrderId:{$in:req.body.orders}},{
            $set:updateBody
        })
    
    
    res.send(ordersUpdated)
})

router.put('/return/:id',auth,async(req,res)=>{
    
    var orderItem = await OrderItems.find({userEmail:req.user.userEmail,TrackingCode:req.params.id,WarehouseStatus:{$ne:"Received"}});
    if(orderItem.length>0){

    orderItem = await OrderItems.updateMany({userEmail:req.user.userEmail,TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Received",
            ReturnDate:new Date(req.body.date),
            ReceiveBy:req.user.userName
        }
    })
    updatedResult = await OrderItems.findOne({TrackingCode:req.params.id},{ReturnDate:1,OrderId:1,TrackingCode:1,ShopName:1,ReceiveBy:1})
    res.send({Status:"Received",updatedResult:updatedResult})
    }
    else{
        orderItem = await OrderItems.find({userEmail:req.user.userEmail,TrackingCode:req.params.id})
        if(orderItem.length>0){
            res.send({Status:"Already Received"})
        }
        else res.send({Status:"Tracking not Found"})
        
    }    
    
})

router.put('/dispatch/:id',auth,async(req,res)=>{
    console.log('Dispatch Date: ',req.body.date)
    var orderItem = await OrderItems.find({userEmail:req.user.userEmail,TrackingCode:req.params.id,Status:"ready_to_ship",WarehouseStatus:{$ne:"Dispatched"}})
    if(orderItem.length>0){
    orderItem = await OrderItems.updateMany({userEmail:req.user.userEmail,TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Dispatched",
            DispatchDate:new Date(req.body.date),
            DispatchBy:req.user.userName

        }
    })
    updatedResult = await OrderItems.findOne({TrackingCode:req.params.id},{DispatchDate:1,OrderId:1,TrackingCode:1,ShopName:1,DispatchBy:1})
    res.send({Status:"Dispatched",updatedResult:updatedResult});
}
else{
  orderItem = await OrderItems.find({userEmail:req.user.userEmail,TrackingCode:req.params.id,Status:"ready_to_ship"})
  if(orderItem.length>0){
    res.send({Status:"Duplicate"})
  }
  else{
      orderItem = await OrderItems.find({userEmail:req.user.userEmail,TrackingCode:req.params.id})
      if(orderItem.length>0){
          res.send({Status:"Order status not eligible to dispatch"})
      }
      else{
          res.send({Status:"Order not Found"})
      }
  }
} 
})

router.get('/getDispatchReceivedOrders/:filter',auth,async(req,res)=>{
    var orderItem;
    var startdate;
    var enddate;
    async function timezone(){

        startdate = new Date(req.query.startdate);
        enddate = new Date(req.query.enddate);
        console.log('Beforestardate: ',startdate)
        console.log('Beforeenddate: ',enddate)

        // startdate.setHours(0,0,0,0);
        enddate.setHours(enddate.getHours()+23,59,59,59);
        console.log('stardate: ',startdate)
        console.log('enddate: ',enddate)
    }
    await timezone();

    var sortBy
    var Username
    if(req.params.filter == "Dispatched"){
    sortBy='$DispatchDate'
    Username={DispatchBy:{$first:"$DispatchBy"}}
    }
    else if(req.params.filter == "Received"){
    sortBy='$ReturnDate'
    Username={ReceiveBy:{$first:"$ReceiveBy"}}
    }

    orderItem = await OrderItems.aggregate([{
        $group:{_id:'$TrackingCode',userEmail:{$first:'$userEmail'},OrderId:{$first:'$OrderId'},Date:{$first:sortBy},ShopName:{$first:'$ShopName'},WarehouseStatus:{$first:'$WarehouseStatus'},...Username}
    },{
        $match:{userEmail:req.user.userEmail,$and:[{Date:{$gte:startdate}},{Date:{$lte:enddate}}]}
    }]).sort({Date:-1})
    
    // console.log(orderItem)
    res.send(orderItem);

})

module.exports = router;