const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/',async(req,res)=>{
    const user =await User.find({},{password:0,_id:0});
    res.send(user);
}
)

router.post('/',async(req,res)=>{
    console.log(req.body)
    let user =await User.findOne({useremail:req.body.useremail});
    if (user) return res.status(400).send({message:"User already exists"}); 

        user = new User({
        useremail:req.body.useremail,
        password:req.body.password,
        usertype:req.body.usertype
    })
    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(user.password,salt);

    await user.save();
    res.send({message:'User Registered'});


})

module.exports = router;