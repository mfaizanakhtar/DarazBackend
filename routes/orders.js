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
    else order = await Order.find({Status:req.params.filter});
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

router.put('/tracking/:id',async(req,res)=>{
    // var order = await Order.find({TrackingCode:req.params.id})
    // console.log(order);
    // if (order){

    // }
    var order = await Order.updateMany({TrackingCode:req.params.id},{
        $set:{
            WarehouseStatus:"Received"
        }
    })   
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
    // console.log(date);
    date.setHours(0,0,0,0);
    // console.log(date);
    enddate = new Date();
    if(req.params.day<=1){
    enddate.setDate(date.getDate()-req.params.day+1);
    enddate.setHours(23,59,59,59);
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
    // console.log(date);
    date.setHours(0,0,0,0);
    // console.log(date);
    enddate = new Date();
    if(req.params.day<=1){
    enddate.setDate(date.getDate()-req.params.day+1);
    enddate.setHours(23,59,59,59);
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

    var Total={_id:'all', FBDcount:TotalFbd,FBMcount:TotalFbm,Total:TotalFbd+TotalFbm};

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