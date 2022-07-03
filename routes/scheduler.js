const express = require('express');
const { updateOrdersData } = require('../scripts/updateOrders');
const router = express.Router();


router.get('/updateOrdersData',async(req,res)=>{
    console.log("updateOrdersData api called")
    await updateOrdersData();
    res.status(200).send();
})

router.get('/updateTransactions',async(req,res)=>{
    console.log("updateTransactions api called")
    await updateTransactions();
    res.status.send(200);
})

router.get('/updateFbdOrderItemStatus',async(req,res)=>{
    console.log("updateFbdOrderItemStatus api called")
    await updateOrderItemStatus({},{$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShippingType:'Own Warehouse'});
    res.status.send(200);
})

router.get('/updateFbmShippedItemStatus',async(req,res)=>{
    console.log("updateFbmShippedItemStatus api called")
    await updateOrderItemStatus({},{Status:'shipped',ShippingType:'Dropshipping'});
    res.status.send(200);
})

router.get('/updateQuickFbmOrderItemStatus',async(req,res)=>{
    console.log("updateQuickFbmOrderItemStatus api called")
    await updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],ShippingType:'Dropshipping'});
    res.status.send(200);
})

router.get('/updateFbmDeliveredOrderItemStatus',async(req,res)=>{
    console.log("updateFbmDeliveredOrderItemStatus api called")
    var startingDate=new Date();
    startingDate=startingDate.setDate(startingDate.getDate()-20)
    await updateOrderItemStatus({},{Status:'delivered',UpdatedAt:{$gte:startingDate}},8*60*60*1000);
    res.status.send(200);
})

router.get('/getAllSkus',async(req,res)=>{
    console.log("getAllSkus api called")
    await getAllSkus();
    res.status.send(200);
})

router.get('/updateAllSkus',async(req,res)=>{
    console.log("updateAllSkus api called")
    await updateAllSkus()
    res.status.send(200);
})

module.exports.schedulerRouter = router;