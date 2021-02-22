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
    order = await Order.find({CreatedAt: {$lte:date},WarehouseStatus:{$ne:"Received"},Status:{$ne:"Delivered"}});
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
        order=await Order.find({Status:"failed",WarehouseStatus:"Received"}).sort({CreatedAt:1})
    }
    else order = await Order.find({Status:req.params.filter}).sort({CreatedAt:1});
    res.send(order);
    // let orders = await Order.find().sort({CreatedAt:1})
    
    // res.send(orders)
    
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

router.get('/sort',async(req,res)=>{
    // var order;
    // if(req.params.filter=="claimable")
    // {
    // date = new Date();
    // date.setDate(date.getDate()-30);
    // console.log(date);
    // order = await Order.find({CreatedAt: {$lte:date},WarehouseStatus:{$ne:"Received"},Status:{$ne:"Delivered"}});
    // }
    // else if(req.params.filter=="all"){
    //     order=await Order.find()
    // }
    // else order = await Order.find({Status:req.params.filter});
    // res.send(order);
    res.send('Api working');
})

router.get('/Skustats/:ShopId/:day',async(req,res)=>{
    var ord=[];
    date = new Date();
    date.setDate(date.getDate()-req.params.day);
    date.setHours(date.getHours()+5)
    date.setHours(0,0,0,0);
    // console.log("Start Date" +date);
    // date.setHours(date.getHours()+5)
    // console.log(date);
    enddate = new Date();
    if(req.params.day<=1){
    enddate.setDate(date.getDate()-req.params.day+1);
    // console.log(enddate);
    enddate.setHours(23,59,59,59);
    // console.log("EndDate" + enddate);
    // console.log('Today & Yesterday End Date');
    // console.log(enddate);
    }
    else if(req.params.day>1){
        enddate.setDate(enddate.getDate());
        // console.log('More than 7 days End Date');
        // console.log(enddate);
    }

    // const TotalFBD = await Order.find({ShippingType:'Own Warehouse'}).count();
    // const TotalFBM = await Order.find({ShippingType:'Dropshipping'}).count();

    var FBDresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:date}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBDcount : {$sum : 1}}}
    ])
    var FBMresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Dropshipping',CreatedAt:{$gte:date},Status:{$ne:'canceled'}}},
        {$group : { _id: '$Sku', FBMcount : {$sum : 1}}}
    ])

    // result.ShopId='kilobyte';
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

router.get('/allstats/:day',async(req,res)=>{
    date = new Date();
    date.setDate(date.getDate()-req.params.day);
    date.setHours(date.getHours()+5)
    date.setHours(0,0,0,0);
    // console.log("Start Date" +date);
    // date.setHours(date.getHours()+5)
    // console.log(date);
    enddate = new Date();
    if(req.params.day<=1){
    enddate.setDate(date.getDate()-req.params.day+1);
    // console.log(enddate);
    enddate.setHours(23,59,59,59);
    // console.log("EndDate" + enddate);
    // console.log('Today & Yesterday End Date');
    // console.log(enddate);
    }
    else if(req.params.day>1){
        enddate.setDate(enddate.getDate());
        // console.log('More than 7 days End Date');
        // console.log(enddate);
    }
    // var testfbd =await Order.find({ShippingType:'Own Warehouse',CreatedAt:{$gte:date}})
    // var testfbm =await Order.find({ShippingType:'Own Warehouse',CreatedAt:{$gte:date}})

    var TotalFbd =await Order.find({ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:date}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();
    var TotalFbm =await Order.find({ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:date}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}).count();

    var Total={_id:'ALL STORES', FBDcount:TotalFbd,FBMcount:TotalFbm,Total:TotalFbd+TotalFbm};

    var ShopFbd = await Order.aggregate([
        {$match:{ShippingType:'Own Warehouse',$and:[{CreatedAt:{$gte:date}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
        {$group:{_id:'$ShopId',FBDcount:{$sum:1}}}
    ])
    var ShopFbm = await Order.aggregate([
        {$match:{ShippingType:'Dropshipping',$and:[{CreatedAt:{$gte:date}},{CreatedAt:{$lte:enddate}}],Status:{$ne:'canceled'}}},
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
    // console.log(testfbd);
    res.send(ShopFbd.sort(function(a,b){
        return a._id - b._id
    }))
    // var TotalFbd = Order.aggregate([
    //     {$match:{ShippingType='Own Warehouse'}},
    //     {$group}
    // ])
})

module.exports = router;