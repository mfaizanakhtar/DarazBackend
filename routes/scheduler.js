const express = require('express');
const { updateTransactions } = require('../scripts/updateFinance');
const { updateOrdersData, updateOrdersOnConfiguredOrderStatuses } = require('../scripts/updateOrders');
const { getAllSkus, updateAllSkus } = require('../scripts/updateSku');
const { updateOrderItemStatus } = require('../scripts/updateStatus');
const {refreshAccessToken} = require('../service/shopService');
const router = express.Router();


router.get('/updateOrdersData',async(req,res)=>{
    console.log("updateOrdersData api called")
    await updateOrdersData();
    res.status(200).send();
})

router.get('/updateOrdersOnConfiguredOrderStatuses',async(req,res)=>{
    console.log("updateOrdersOnConfiguredOrderStatuses api called")
    await updateOrdersOnConfiguredOrderStatuses();
    res.status(200).send();
})

router.get('/refreshAccessToken',async(req,res)=>{
    console.log("refreshAccessToken api called")
    await refreshAccessToken();
    res.status(200).send();
})

router.get('/updateTransactions',async(req,res)=>{
    console.log("updateTransactions api called")
    if(req.query?.days) await updateTransactions(req.query?.days);
    else await updateTransactions();
    res.status(200).send();
})

router.get('/updateFbdOrderItemStatus',async(req,res)=>{
    console.log("updateFbdOrderItemStatus api called")
    await updateOrderItemStatus({},{$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShippingType:'Own Warehouse'});
    res.status(200).send();
})

router.get('/updateFbmShippedItemStatus',async(req,res)=>{
    console.log("updateFbmShippedItemStatus api called")
    await updateOrderItemStatus({},{Status:'shipped',ShippingType:'Dropshipping'});
    res.status(200).send();
})

router.get('/updateQuickFbmOrderItemStatus',async(req,res)=>{
    console.log("updateQuickFbmOrderItemStatus api called")
    await updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],ShippingType:'Dropshipping'});
    res.status(200).send();
})

router.get('/updateFbmDeliveredOrderItemStatus',async(req,res)=>{
    console.log("updateFbmDeliveredOrderItemStatus api called")
    var startingDate=new Date();
    startingDate=startingDate.setDate(startingDate.getDate()-20)
    await updateOrderItemStatus({},{Status:'delivered',UpdatedAt:{$gte:startingDate}},8*60*60*1000);
    res.status(200).send();
})

router.get('/getAllSkus',async(req,res)=>{
    console.log("getAllSkus api called")
    await getAllSkus();
    res.status(200).send();
})

router.get('/updateAllSkus',async(req,res)=>{
    console.log("updateAllSkus api called")
    await updateAllSkus()
    res.status(200).send();
})

module.exports.schedulerRouter = router;