const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/',async(req,res)=>{
    const user =await User.find();
    res.send(user);
}
)

router.post('/adduser',async(req,res)=>{
    let user =await User.findOne({userid:req.body.userid});
    if (user) return res.status(400).send({message:"User already exists"}); 

        user = new User({
        userid:req.body.userid,
        password:req.body.password,
        usertype:req.body.usertype
    })
    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(user.password,salt);

    await user.save();
    res.send({message:'User Registered'});


})

module.exports = router;