const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth')

router.get('/',async(req,res)=>{
    const user =await User.find({},{password:0,_id:0});
    res.send(user);
}
)

router.post('/',auth,async(req,res)=>{
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

router.put('/updateUser',auth,async(req,res)=>{
    var update = await User.updateOne({useremail:req.params.useremail},{
        useremail:req.body.useremail,
        password:req.body.password,
        usertype:req.body.usertype
    });
    res.send(update)
})

router.post('/deleteUser',auth,async(req,res)=>{
    var del = await User.deleteMany({useremail:req.body.useremail})
    res.send(del)
})

router.put('/updatePassword',auth,async(req,res)=>{
    // console.log(req.body)
    let user = await User.findOne({useremail:req.user.useremail})
    const password = await bcrypt.compare(req.body.oldPassword,user.password)
    // console.log(password)
    if(password==true){
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword,salt)

        await user.save()
        res.send({message:'Password Updated'})
    }
    else res.send({message:'Incorrect Old Password'})
})

module.exports = router;