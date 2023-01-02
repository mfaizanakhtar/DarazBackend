const express = require('express');
const auth = require('../middleware/auth');
const { OrderItems } = require('../models/orderItem');
const { createCustomOrderStatus, getCustomStatuses, deleteCustomStatus } = require('../service/customOrderStatusService');
const router = express.Router();

router.post('/createStatus',auth,async(req,res)=>{
    /*{
        statusName:"failed"
        isEdit:"false"
        statusArray:[{
            filterType:"AND".
            filter:"Order status",
            isNot:"false",
            value:"pending"

        }]
    }*/
    try{
        let createCustomStatusResp = await createCustomOrderStatus(req.body,req.user.userEmail)
        return res.status(201).send(createCustomStatusResp);
    }catch(ex){
        return res.status(500).send({message:ex});
    }


})

router.get('/getAllCustomStatuses',auth,async(req,res)=>{
    try{
        let allCustomStatuses = await getCustomStatuses(req.user.userEmail)
        return res.status(200).send(allCustomStatuses);
    }catch(ex){
        return res.status(500).send({message:ex});
    }


})

router.get('/getAllDarazOrderStatuses',async(req,res)=>{
    try{
        let orderStatuses = await OrderItems.aggregate([
            {
                $group:{_id:'$Status'}
            }
        ])
        console.log(orderStatuses)
        if(orderStatuses.length>0 && orderStatuses[0]._id){
            let mappedOrderStatuses = orderStatuses.map(status=>status._id)
            return res.status(200).send({statuses:mappedOrderStatuses})
        }else{
            return res.status(200).send({statuses:[]})
        }
    }catch(ex){
        return res.status(500).send({message:ex.message})
    }

}) 

router.delete('/deleteCustomStatus/:statusName',auth,async(req,res)=>{
    try{
        let deleteStatus = await deleteCustomStatus(req.user.userEmail,req.params.statusName)
        return res.status(200).send(deleteStatus);
    }catch(ex){
        return res.status(500).send({message:ex});
    }


})


module.exports.customOrderStatusRouter = router;