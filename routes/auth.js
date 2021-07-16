const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');


router.post('/',async(req,res)=>{
    // console.log(req.body)
    
    const user = await User.findOne({ useremail:req.body.useremail })
    if(!user) {
        if(req.body.useremail=='admin'){
            admin = new User({
                useremail:'admin',
                password:'admin',
                usertype:'admin'
            })
            const salt = await bcrypt.genSalt(10);
            admin.password =await bcrypt.hash(admin.password,salt);
        
            await admin.save();
            let token = admin.generateAuthToken();
            res.send({"token":token});
        }
        else return res.send({message:'User not found'});
    }
    

    const password = await bcrypt.compare(req.body.password,user.password);
    // console.log(password)
    if (password == true){
        let token = user.generateAuthToken();
        res.send({"token":token});
    }
    
    
})

module.exports = router;