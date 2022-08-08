const express = require('express')
const router = express.Router()


router.get('/shop',(req,res)=>{
    console.log(req.body);
    console.log(req.query);
    console.log(req.params);
    res.status(201).send({})
})

module.exports.ShopIntegrate = router;
