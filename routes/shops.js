const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Shop } = require('../models/shop');
const { generateAccessTokenUrl } = require('../scripts/GenerateUrl');
const { GetData } = require('../scripts/HttpReq')
const moment = require('moment');
const { authoriseAndAddShop } = require('../service/shopService');

router.get('/authorise',auth,async(req,res)=>{
    try{
        var result = await authoriseAndAddShop(req.query,req.user);
        res.status(201).send(result);
    }catch(ex){
        if(!ex.status) ex.status=500
        res.status(ex.status).send({message:ex.message})
    }
    
})

router.get('/getAll',auth,async(req,res)=>{
    const shop =await Shop.find({userEmail:req.user.userEmail,appStatus:true},{accessToken:0,refreshExpiresIn:0,refreshToken:0,tokenExpiresIn:0,__v:0,_id:0});
    res.send(shop);
})

router.delete('/delete/:id',auth,async(req,res)=>{
    updateResult = await Shop.updateOne({shortCode:req.params.id,userEmail:req.user.userEmail},{appStatus:false})
    console.log(updateResult)
    res.send(updateResult)
})

module.exports = router;