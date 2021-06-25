const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');


router.post('/',async(req,res)=>{
    // console.log(req.body)
    const user = await User.findOne({ useremail:req.body.useremail })
    if(!user) return res.send({message:'User not found'});

    const password = await bcrypt.compare(req.body.password,user.password);
    // console.log(password)
    if (password == true){
        let token = user.generateAuthToken();
        res.send({"token":token});
    }
    
    
})

module.exports = router;