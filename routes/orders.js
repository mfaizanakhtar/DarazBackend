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

router.get('/Skustats/:ShopId/:days',async(req,res)=>{
    var ord=[];
    date = new Date();
    date.setDate(date.getDate()-req.params.days);
    date.setHours(5,0,0,0);

    // const TotalFBD = await Order.find({ShippingType:'Own Warehouse'}).count();
    // const TotalFBM = await Order.find({ShippingType:'Dropshipping'}).count();

    var FBDresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Own Warehouse',CreatedAt:{$gte:date}}},
        {$group : { _id: '$Sku', FBDcount : {$sum : 1}}}
    ])
    var FBMresult = await Order.aggregate([
        {$match: {ShopId:req.params.ShopId,ShippingType:'Dropshipping',CreatedAt:{$gte:date}}},
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
    res.send(OutputResult);

    
})

router.get('/allstats/:day',async(req,res)=>{
    date = new Date();
    date.setDate(date.getDate()-req.params.day);
    date.setHours(5,0,0,0);
    // var testfbd =await Order.find({ShippingType:'Own Warehouse',CreatedAt:{$gte:date}})
    // var testfbm =await Order.find({ShippingType:'Own Warehouse',CreatedAt:{$gte:date}})

    var TotalFbd =await Order.find({ShippingType:'Own Warehouse',CreatedAt:{$gte:date}}).count();
    var TotalFbm =await Order.find({ShippingType:'Dropshipping',CreatedAt:{$gte:date}}).count();

    var Total={_id:'all', FBDcount:TotalFbd,FBMcount:TotalFbm,Total:TotalFbd+TotalFbm};

    var ShopFbd = await Order.aggregate([
        {$match:{ShippingType:'Own Warehouse',CreatedAt:{$gte:date}}},
        {$group:{_id:'$ShopId',FBDcount:{$sum:1}}}
    ])
    var ShopFbm = await Order.aggregate([
        {$match:{ShippingType:'Dropshipping',CreatedAt:{$gte:date}}},
        {$group:{_id:'$ShopId',FBMcount:{$sum:1}}}
    ])

    
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
    res.send(ShopFbd)
    // var TotalFbd = Order.aggregate([
    //     {$match:{ShippingType='Own Warehouse'}},
    //     {$group}
    // ])
})

module.exports = router;