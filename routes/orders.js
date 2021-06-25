const mongoose = require('mongoose');
const express = require('express');
const { Order } = require('../models/order');
const router = express.Router();

router.get('/all',async(req,res)=>{
    const orders = await Order.find()
    res.send(orders);
})

router.get('/data/:filter',async(req,res)=>{
    //join then find
    const orders = await Order.aggregate([
        {$lookup:{
            from:'orderitems',
            localField:"OrderItems",
            foreignField:"_id",
            as:"orderitems"
        }},
        {$match:{
            "orderitems.TrackingCode":'PK-DEX013223201'
        }}
    ])
    res.send(...orders)
})

module.exports = router