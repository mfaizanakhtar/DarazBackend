const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const {Sku} = require('../models/sku');


router.get('/getAllSkus',auth,(req,res)=>{
    var skus = Sku.findMany({useremail})
})