const express = require('express');
const router = express.Router()
const {Transaction} = require('../models/transaction');
const auth = require('../middleware/auth');

router.get('/',auth,async(req,res)=>{
    var Transactions = await Transaction.find({useremail:req.user.useremail})
    .skip(parseInt(req.query.pSize)*parseInt(req.query.pIndex))
    .limit(parseInt(req.query.pSize))
    
    var Length = await Transaction.find({useremail:req.user.useremail}).count()

    res.send({Transactions:Transactions,Length:Length})
})

module.exports=router;