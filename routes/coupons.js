const express = require('express');
const auth = require('../middleware/auth');
const { Coupon } = require('../models/coupon');
const moment = require('moment');
const router = express.Router();


router.get('/applyCoupon',auth,async(req,res)=>{
   const coupon = await Coupon.findOne({couponCode:req.query.couponCode.toUpperCase(),active:true})
   try{
        if(coupon){
            if(coupon.isMaxUsage && coupon.maxUsage && coupon.maxUsage<=0){
                throw new Error("Max Usage for the coupon reached")
            }
            currentDate=moment().toDate();
            if (coupon.endDate > currentDate && coupon.startDate < currentDate ){
            if(req.query.totalAmount<coupon.minAmount){
                return res.send({message:"Total is less than min amount: "+coupon.minAmount})
            }
            var calculatedValue;
            if(coupon.type=='fixed'){
                calculatedValue = coupon.value;
            }else if(coupon.type=='percent'){
                calculatedValue = (req.query.totalAmount*coupon.value)/100
            }
            calculatedValue = (calculatedValue > coupon.maxCap && coupon.maxCap!=0) ? coupon.maxCap : calculatedValue
            res.send({message:"success",couponValue:calculatedValue})
            }else{
                throw new Error("Invalid Coupon or expired")
            }
        }else{
            throw new Error("Invalid Coupon or expired")
        }
    }catch(ex){
        res.send({message:ex.message});
    }

})


router.post('/addCoupon',async(req,res)=>{
    const isDuplicate = await Coupon.findOne({couponCode:req.body.couponCode.toUpperCase()})
    try{
        if(!isDuplicate){
            var coupon = new Coupon({
                couponCode:req.body.couponCode.toUpperCase(),
                startDate:req.body.startDate,
                endDate:req.body.endDate,
                type:req.body.type,
                value:req.body.value,
                minAmount:req.body.minAmount,
                maxCap:req.body.maxCap
            })
            if(req.body.maxUsage){
                coupon.maxUsage = req.body.maxUsage;
                coupon.isMaxUsage=true;
            }
            if(req.body.type='percent' && req.body.value>100){
                coupon.value=100;
            }
            await coupon.save();
            return res.send({message:"coupon created successfully"})
        }else{
            throw new Error("coupon already exists")
        }
    }catch(ex){
        res.send({message:ex.message})
    }
})

module.exports=router;

