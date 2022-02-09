const mongoose = require('mongoose');
const express = require('express');
const { Lookup } = require('../models/lookup');
const auth = require('../middleware/auth');
const router = express.Router();


router.get('/getLookup/:key',auth,async(req,res)=>{
    console.log(req.params.key)
    var lookup = await Lookup.findOne({lookup_key:req.params.key});
    console.log(lookup)
    res.status(200).send(lookup);
})

module.exports.lookups = router