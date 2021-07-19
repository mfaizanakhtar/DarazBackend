const express = require('express');
const router = express.Router();
const { OrderItems } = require('../models/orderItem');
const auth = require('../middleware/auth')

router.get('/data/:filter',auth,async(req,res)=>{
    var orderItem;
    if(req.params.filter=="claimable")
    {
    date = new Date();
    date.setDate(date.getDate()-30);
    console.log(date);
    orderItem = await OrderItems.find({CreatedAt: {$lte:date},WarehouseStatus:"Dispatched",Status:{$ne:"delivered"}});
    }
    else if(req.params.filter=="all"){
        orderItem=await OrderItems.find().populate('Order').sort({CreatedAt:1})
    }
    else if(req.params.filter=="ready_to_ship"){
        orderItem=await OrderItems.find({Status:"ready_to_ship",WarehouseStatus:{$ne:"Dispatched"}}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="failed"){
        orderItem=await OrderItems.find({Status:"failed",WarehouseStatus:{$ne:"Received"}}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="ready_to_ship-dispatched"){
        orderItem=await OrderItems.find({Status:"ready_to_ship",WarehouseStatus:"Dispatched"}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="failed-received"){
        orderItem=await OrderItems.find({WarehouseStatus:"Received"}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="Claim Filed"){
        orderItem=await OrderItems.find({$or:[{WarehouseStatus:"Claim Filed"},{WarehouseStatus:"Claim Approved"},{WarehouseStatus:"Claim Rejected"},{WarehouseStatus:"Claim POD Dispute"}]}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="Claim Received"){
        orderItem=await OrderItems.find({WarehouseStatus:"Claim Received"}).sort({CreatedAt:1})
    }
    else orderItem = await OrderItems.find({Status:req.params.filter}).sort({CreatedAt:1});
    res.send(orderItem);

})

router.put('/Update/:Status',async(req,res)=>{
    console.log(req.body)
    
        ordersUpdated = await OrderItems.updateMany({OrderId:{$in:req.body}},{
            $set:{
                WarehouseStatus:req.params.Status
            }
        })
    
    
    res.send(ordersUpdated)
})

router.put('/return/:id',auth,async(req,res)=>{
    
    var orderItem = await OrderItems.find({useremail:req.user.useremail,TrackingCode:req.params.id,WarehouseStatus:{$ne:"Received"}});
    if(orderItem.length>0){

    orderItem = await OrderItems.updateMany({useremail:req.user.useremail,TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Received",
            ReturnDate:new Date()
        }
    })

    updatedResult = await OrderItems.findOne({TrackingCode:req.params.id},{ReturnDate:1,OrderId:1,TrackingCode:1,ShopId:1})
    res.send([{Status:"Received"},updatedResult])
    }
    else{
        orderItem = await OrderItems.find({useremail:req.user.useremail,TrackingCode:req.params.id})
        if(orderItem.length>0){
            res.send({Status:"Already Received"})
        }
        else res.send({Status:"Tracking not Found"})
        
    }    
    
})

router.put('/dispatch/:id',auth,async(req,res)=>{
    var orderItem = await OrderItems.find({useremail:req.user.useremail,TrackingCode:req.params.id,Status:"ready_to_ship",WarehouseStatus:{$ne:"Dispatched"}})
    if(orderItem.length>0){
    orderItem = await OrderItems.updateMany({useremail:req.user.useremail,TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Dispatched",
            DispatchDate:new Date()
        }
    })
    updatedResult = await OrderItems.findOne({TrackingCode:req.params.id},{ReturnDate:1,OrderId:1,TrackingCode:1,ShopId:1})
    res.send([{Status:"Dispatched"},updatedResult]);
}
else{
  orderItem = await OrderItems.find({useremail:req.user.useremail,TrackingCode:req.params.id,Status:"ready_to_ship"})
  if(orderItem.length>0){
    res.send({Status:"Duplicate"})
  }
  else{
      orderItem = await OrderItems.find({useremail:req.user.useremail,TrackingCode:req.params.id})
      if(orderItem.length>0){
          res.send({Status:"Order status not eligible to dispatch"})
      }
      else{
          res.send({Status:"Order not Found"})
      }
  }
} 
})

router.get('/ordermovement/:filter',auth,async(req,res)=>{
    var orderItem;

    var startdate;
    var enddate;
    async function timezone(){

        startdate = new Date();
        // startdate.setHours(startdate.getHours()+5);
        startdate.setHours(0,0,0,0);
        enddate = new Date();
        enddate.setHours(23,59,59,59);
        console.log('stardate: ',startdate)
        console.log('enddate: ',enddate)
    }
    await timezone();

    var sortBy
    if(req.params.filter == "Dispatched"){
    sortBy='$DispatchDate'
    }
    else if(req.params.filter == "Received"){
    sortBy='$ReturnDate'
    }

    orderItem = await OrderItems.aggregate([{
        $group:{_id:'$TrackingCode',useremail:{$first:'$useremail'},OrderId:{$first:'$OrderId'},Date:{$first:sortBy},ShopId:{$first:'$ShopId'},WarehouseStatus:{$first:'$WarehouseStatus'}}
    },{
        $match:{useremail:req.user.useremail,WarehouseStatus:req.params.filter,$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    }]).sort({Date:-1})
    
    // console.log(orderItem)
    res.send(orderItem);

})


router.get('/Skustats',auth,async(req,res)=>{

    var startdate;
    var enddate;
    //setting start and end date
    async function timezone(){

    startdate = new Date(req.query.startdate);
    startdate.setHours(startdate.getHours()+5);
    enddate = new Date(req.query.enddate);
    enddate.setHours(enddate.getHours()+28,59,59,59);

    }
    await timezone();
    //aggregate result for FBD and FBM
    var FBDresult = await OrderItems.aggregate([
        {$match: {useremail:req.user.useremail,ShopId:req.query.ShopId,ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBDcount : {$sum : 1}}}
    ])
    var FBMresult = await OrderItems.aggregate([
        {$match: {useremail:req.user.useremail,ShopId:req.query.ShopId,ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBMcount : {$sum : 1}}}
    ])
    //modifying FBD aggregate result by setting default FBM as 0 and shopId supplied in args
    OutputResult = FBDresult.map(r=>{
        var o = Object.assign({},r);
        o.FBMcount = 0;
        o.Total=o.FBDcount;
        o.ShopId = req.query.ShopId;
        
        return o;
    })
    

    FBMresult.forEach(fbm=>{
        //iterating fbm skus and matching with fbd skus
        var filteredresult = OutputResult.filter(fbd=>{
            return (fbd.ShopId==req.query.ShopId) && (fbd._id == fbm._id)
        })
        //if not matched,fbd = 0 and total = fbm and pushing this sku to outputResult since no entry there
        if(filteredresult.length<=0){
            fbm.FBDcount=0
            fbm.Total = fbm.FBMcount
            fbm.ShopId=req.query.ShopId
            OutputResult.push(fbm);
        }
        else{
            //if entry found, FBMcount field has FBM and total has FBM qty added
        OutputResult.forEach(fbd => {
           if(fbd.ShopId==req.query.ShopId && fbd._id == fbm._id){
                fbd.FBMcount = fbm.FBMcount
                fbd.Total=fbd.FBDcount+fbm.FBMcount
           } 
        });
        }

        
    })
    //finally sorting through all skus output
    OutputResult = OutputResult.sort((a,b)=>{
        return a._id - b._id;
    })
    res.send(OutputResult);

    
})

router.get('/allstats',auth,async(req,res)=>{
    var startdate;
    var enddate;
    //setting timezone startdate and enddate
    async function timezone(){

    startdate = new Date(req.query.startdate);
    startdate.setHours(startdate.getHours()+5);
    enddate = new Date(req.query.enddate);
    enddate.setHours(enddate.getHours()+28,59,59,59);

    }
    await timezone();
    //finding total count for ALLSTORES FBD AND FBM

    var TotalFbd =await OrderItems.find({useremail:req.user.useremail,ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();
    var TotalFbm =await OrderItems.find({useremail:req.user.useremail,ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();
    //creating Total object to total both FBD and FBM
    var Total={_id:'ALL STORES', FBDcount:TotalFbd,FBMcount:TotalFbm,Total:TotalFbd+TotalFbm};
    console.log(startdate);
    console.log(enddate);
    //aggregate FBD on basis on Shops IDs
    var ShopFbd = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group:{_id:'$ShopId',FBDcount:{$sum:1}}}
    ])
    //aggregate FBM on basis of Shops IDS
    console.log(ShopFbd);
    var ShopFbm = await OrderItems.aggregate([
        {$match:{useremail:req.user.useremail,ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group:{_id:'$ShopId',FBMcount:{$sum:1}}}
    ])

    //setting total FBMcount 0 by default and total as FBD
    ShopFbd = ShopFbd.map(r=>{
        var o = Object.assign({},r);
        o.FBMcount = 0;
        o.Total = o.FBDcount
        return o;
    })
    //iterating all shops with fbm and matching ids in fbd search
    ShopFbm.forEach(fbm => {
        var filteredresult = ShopFbd.filter(f=>{
                return (f._id == fbm._id)
            });
        //if not matched, fbm count is total. fbd count is 0 since not found
        if(filteredresult.length<=0){
            fbm.FBDcount = 0;
            fbm.Total = fbm.FBMcount;
            ShopFbd.push(fbm);
        }
        else{
            //if found, iterate on fbd result, add fbmcount with matching id and add to total.
            ShopFbd.forEach(fbd => {
                if(fbd._id == fbm._id){
                    fbd.FBMcount = fbm.FBMcount
                    fbd.Total = fbd.FBDcount + fbd.FBMcount
                }
            });
        }
 
    });
    //at the end, push ALLIDs with rest of IDS and sort 
    ShopFbd.push(Total);
    res.send(ShopFbd.sort(function(a,b){
        return a._id - b._id
    }))

})

module.exports = router;