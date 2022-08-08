const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Shop } = require('../models/shop');
const { generateAccessTokenUrl } = require('../scripts/GenerateUrl');
const { GetData } = require('../scripts/HttpReq')
const moment = require('moment');


router.post('/',auth,async(req,res)=>{
    const shop = new Shop({
        shopid:req.body.shopid,
        secretkey:req.body.secretkey,
        useremail:req.user.useremail,
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
    console.log(req.query)
    var url = generateAccessTokenUrl(req.query.code)
    console.log(url)
    var response = await GetData(url);
    var saveResult;
    if(response.access_token){
        const shop = new Shop({
            userEmail:req.user.userEmail,
            accessToken:response.access_token,
            tokenExpiresIn:moment().add(response.expires_in,'seconds'),
            refreshToken:response.refresh_token,
            refreshExpiresIn:moment().add(response.refresh_expires_in,'seconds'),
            country:response.country,
            account:response.account,
            accountPlatform:response.account_platform,
            sellerId:response.user_info.seller_id
    
        })
        saveResult=await shop.save()
    }
    if(saveResult){
        res.status(201).send();
    }else{
        res.status(400).send();
    }
})

router.get('/',auth,async(req,res)=>{
    const shop =await Shop.find({useremail:req.user.useremail});
    res.send(shop);
})

router.put('/update',auth,async(req,res)=>{
    updateResult = await Shop.update({_id:req.body._id,useremail:req.user.useremail},{
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
    deletedResult = await Shop.remove({shopid:req.params.id,useremail:req.user.useremail})
    console.log(deletedResult)
    res.send(deletedResult)
})

module.exports = router;