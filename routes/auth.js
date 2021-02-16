const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');


router.post('/',async(req,res)=>{
    const user = await User.findOne({ userid:req.body.userid })
    if(!user) return res.send({message:'User not found'});

    const password = await bcrypt.compare(req.body.password,user.password);
    if (password == true){
        let token = user.generateAuthToken()
        res.send({"token":token});
    }
    
    
})

module.exports = router;