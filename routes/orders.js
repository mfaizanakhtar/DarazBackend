const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');

router.get('/data/:filter',async(req,res)=>{
    var order;
    if(req.params.filter=="claimable")
    {
    date = new Date();
    date.setDate(date.getDate()-30);
    console.log(date);
    order = await Order.find({CreatedAt: {$lte:date},WarehouseStatus:"Dispatched",Status:{$ne:"delivered"}});
    }
    else if(req.params.filter=="all"){
        order=await Order.find().sort({CreatedAt:1})
    }
    else if(req.params.filter=="ready_to_ship"){
        order=await Order.find({Status:"ready_to_ship",WarehouseStatus:{$ne:"Dispatched"}}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="failed"){
        order=await Order.find({Status:"failed",WarehouseStatus:{$ne:"Received"}}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="ready_to_ship-dispatched"){
        order=await Order.find({Status:"ready_to_ship",WarehouseStatus:"Dispatched"}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="failed-received"){
        order=await Order.find({WarehouseStatus:"Received"}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="Claim Filed"){
        order=await Order.find({$or:[{WarehouseStatus:"Claim Filed"},{WarehouseStatus:"Claim Approved"},{WarehouseStatus:"Claim Rejected"},{WarehouseStatus:"Claim POD Dispute"}]}).sort({CreatedAt:1})
    }
    else if(req.params.filter=="Claim Received"){
        order=await Order.find({WarehouseStatus:"Claim Received"}).sort({CreatedAt:1})
    }
    else order = await Order.find({Status:req.params.filter}).sort({CreatedAt:1});
    res.send(order);

})

router.post('/',async(req,res)=>{
    const result = await Order.findOne({OrderItemId: req.body.OrderItemId})
    if (result) return res.status(404).send("Order already exists");
    const order = new Order({
        OrderId:req.body.OrderId,
        OrderItemId:req.body.OrderItemId,
        ShopId:req.body.ShopId,
        Name:req.body.Name,
        Sku:req.body.Sku,
        ShopSku:req.body.ShopSku,
        ShippingType:req.body.ShippingType,
        ItemPrice:req.body.ItemPrice,
        ShippingAmount:req.body.ShippingAmount,
        Status:req.body.Status,
        TrackingCode:req.body.TrackingCode,
        ShippingProviderType:req.body.ShippingProviderType,
        CreatedAt:req.body.CreatedAt,
        UpdatedAt:req.body.UpdatedAt,
        productMainImage:req.body.productMainImage,
        Variation:req.body.Variation
    })
    await order.save();
    res.send("Order added");
})

router.put('/Update/:Status',async(req,res)=>{
    var orders=req.body;
    orders.forEach(async o => {
        o = await Order.updateMany({OrderItemId:o.OrderItemId},{
            $set:{
                WarehouseStatus:req.params.Status
            }
        })
    });
    res.send({Status:"Success"})
})

router.put('/return/:id',async(req,res)=>{
    var order = await Order.find({TrackingCode:req.params.id,WarehouseStatus:{$ne:"Received"}});
    if(order.length>0){

    order = await Order.updateMany({TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Received",
            ReturnDate:new Date()
        }
    })
    res.send({Status:"Received"})
    }
    else{
        order = await Order.find({TrackingCode:req.params.id})
        if(order.length>0){
            res.send({Status:"Already Received"})
        }
        else res.send({Status:"Tracking not Found"})
        
    }    
    
})

router.put('/dispatch/:id',async(req,res)=>{
    var order = await Order.find({TrackingCode:req.params.id,Status:"ready_to_ship",WarehouseStatus:{$ne:"Dispatched"}})
    if(order.length>0){
    order = await Order.updateMany({TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Dispatched",
            DispatchDate:new Date()
        }
    })
    
    res.send({Status:"Dispatched"});
}
else{
  order = await Order.find({TrackingCode:req.params.id,Status:"ready_to_ship"})
  if(order.length>0){
    res.send({Status:"Duplicate"})
  }
  else{
      order = await Order.find({TrackingCode:req.params.id})
      if(order.length>0){
          res.send({Status:"Order status not eligible to dispatch"})
      }
      else{
          res.send({Status:"Order not Found"})
      }
  }
} 
})

router.get('/ordermovement/:filter',async(req,res)=>{
    var order;
    date = new Date();
    date.setHours(date.getHours()+5);
    date.setHours(0,0,0,0)
    console.log(date);
    if(req.params.filter == "Dispatched"){
    order = await Order.find({WarehouseStatus:req.params.filter,DispatchDate:{$gte:date}}).sort({DispatchDate:-1})
    }
    else if(req.params.filter == "Received"){
    order = await Order.find({WarehouseStatus:req.params.filter,ReturnDate:{$gte:date}}).sort({ReturnDate:-1})
    }
    res.send(order);

})


router.get('/Skustats/:ShopId/:startdate/:enddate',async(req,res)=>{

    var startdate;
    var enddate;

    async function timezone(){

    startdate = new Date(req.params.startdate);
    startdate.setHours(startdate.getHours()+5);
    enddate = new Date(req.params.enddate);
    enddate.setHours(enddate.getHours()+28,59,59,59);

    }
    await timezone();

    var FBDresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBDcount : {$sum : 1}}}
    ])
    var FBMresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBMcount : {$sum : 1}}}
    ])

    OutputResult = FBDresult.map(r=>{
        var o = Object.assign({},r);
        o.FBMcount = 0;
        o.Total=o.FBDcount;
        o.ShopId = req.params.ShopId;
        
        return o;
    })
    

    FBMresult.forEach(fbm=>{
        var filteredresult = OutputResult.filter(fbd=>{
            return (fbd.ShopId==req.params.ShopId) && (fbd._id == fbm._id)
        })
        if(filteredresult.length<=0){
            fbm.FBDcount=0
            fbm.Total = fbm.FBMcount
            fbm.ShopId=req.params.ShopId
            OutputResult.push(fbm);
        }
        else{
        OutputResult.forEach(fbd => {
           if(fbd.ShopId==req.params.ShopId && fbd._id == fbm._id){
                fbd.FBMcount = fbm.FBMcount
                fbd.Total=fbd.FBDcount+fbm.FBMcount
           } 
        });
        }

        
    })
    OutputResult = OutputResult.sort((a,b)=>{
        return a._id - b._id;
    })
    res.send(OutputResult);

    
})

router.get('/allstats/:startdate/:enddate',async(req,res)=>{
    var startdate;
    var enddate;

    async function timezone(){

    startdate = new Date(req.params.startdate);
    startdate.setHours(startdate.getHours()+5);
    enddate = new Date(req.params.enddate);
    enddate.setHours(enddate.getHours()+28,59,59,59);

    }
    await timezone();

    var TotalFbd =await Order.find({ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();
    var TotalFbm =await Order.find({ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();

    var Total={_id:'ALL STORES', FBDcount:TotalFbd,FBMcount:TotalFbm,Total:TotalFbd+TotalFbm};
    console.log(startdate);
    console.log(enddate);
    var ShopFbd = await Order.aggregate([
        {$match:{ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group:{_id:'$ShopId',FBDcount:{$sum:1}}}
    ])
    console.log(ShopFbd);
    var ShopFbm = await Order.aggregate([
        {$match:{ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group:{_id:'$ShopId',FBMcount:{$sum:1}}}
    ])


    ShopFbd = ShopFbd.map(r=>{
        var o = Object.assign({},r);
        o.FBMcount = 0;
        o.Total = o.FBDcount
        return o;
    })
    
    ShopFbm.forEach(fbm => {
        var filteredresult = ShopFbd.filter(f=>{
                return (f._id == fbm._id)
            });
        if(filteredresult.length<=0){
            fbm.FBDcount = 0;
            fbm.Total = fbm.FBMcount;
            ShopFbd.push(fbm);
        }
        else{
            ShopFbd.forEach(fbd => {
                if(fbd._id == fbm._id){
                    fbd.FBMcount = fbm.FBMcount
                    fbd.Total = fbd.FBDcount + fbd.FBMcount
                }
            });
        }
 
    });
    ShopFbd.push(Total);
    res.send(ShopFbd.sort(function(a,b){
        return a._id - b._id
    }))

})

module.exports = router;