const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Shop } = require('../models/shop');
const { generateAccessTokenUrl } = require('../scripts/GenerateUrl');
const { GetData } = require('../scripts/HttpReq')
const moment = require('moment');
const { authoriseAndAddShop } = require('../service/shopService');


router.post('/',auth,async(req,res)=>{
    const shop = new Shop({
        shopid:req.body.shopid,
        secretkey:req.body.secretkey,
        useremail:req.user.userEmail,
        shopName:req.body.shopName,
        shopAddress:req.body.shopAddress,
        shopState:req.body.shopState,
        shopArea:req.body.shopArea,
        shopLocation:req.body.shopLocation,
        shopPhone:req.body.shopPhone
    })

    await shop.save();
    res.send({message:"Success"});
})

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
    const shop =await Shop.find({userEmail:req.user.userEmail});
    res.send(shop);
})

router.put('/update',auth,async(req,res)=>{
    updateResult = await Shop.update({_id:req.body._id,useremail:req.user.userEmail},{
        $set:{
            shopid:req.body.shopid,
            secretkey:req.body.secretkey,
            shopName:req.body.shopName,
            shopAddress:req.body.shopAddress,
            shopState:req.body.shopState,
            shopArea:req.body.shopArea,
            shopLocation:req.body.shopLocation,
            shopPhone:req.body.shopPhone
        }
    })

    res.send(updateResult)
})

router.delete('/:id',auth,async(req,res)=>{
    deletedResult = await Shop.remove({shopid:req.params.id,useremail:req.user.userEmail})
    console.log(deletedResult)
    res.send(deletedResult)
})

module.exports = router;