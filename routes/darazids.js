const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Darazid } = require('../models/darazid');


router.post('/',auth,async(req,res)=>{
    const darazid = new Darazid({
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

    await darazid.save();
    res.send({message:"Success"});
})

router.get('/',auth,async(req,res)=>{
    const darazids =await Darazid.find({useremail:req.user.useremail});
    res.send(darazids);
})

router.put('/update',auth,async(req,res)=>{
    updateResult = await Darazid.update({_id:req.body._id,useremail:req.user.useremail},{
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
    deletedResult = await Darazid.remove({shopid:req.params.id,useremail:req.user.useremail})
    console.log(deletedResult)
    res.send(deletedResult)
})

module.exports = router;