const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const { UserSubsciprtion } = require('../models/userSubscription');

router.get('/',async(req,res)=>{
    const user =await User.find({accountType:"root"},{password:0,_id:0});
    res.send(user);
}
)

router.post('/',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        let user =await User.findOne({$or:[{useremail:req.body.useremail.toLowerCase()},{loginemail:req.body.useremail.toLowerCase()}]});
        if (user) return res.status(400).send({message:"User already exists"}); 

            user = new User({
            useremail:req.body.useremail.toLowerCase(),
            loginemail:req.body.useremail.toLowerCase(),
            password:req.body.password,
            usertype:req.body.usertype
        })
        const salt = await bcrypt.genSalt(10);
        user.password =await bcrypt.hash(user.password,salt);

        await user.save();
        res.send({message:'User Registered'});
    }
    else{
        res.send({message:"Unauthorized"})
    }


})

router.put('/updateUser/:loginemail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        // console.log(req.params.useremail)
        var update = await User.updateOne({loginemail:req.params.loginemail.toLowerCase()},{
            usertype:req.body.usertype
        });
        res.send(update)
    }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.put('/resetPassword/:loginemail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        const salt = await bcrypt.genSalt(10);
        var password=await bcrypt.hash('password.123',salt)

        var update = await User.updateOne({loginemail:req.params.loginemail.toLowerCase()},{
            password:password
        });
        res.send(update)
        }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.post('/deleteUser',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        var del = await User.deleteMany({useremail:req.body.useremail.toLowerCase()})
        res.send(del)
    }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.put('/updatePassword',auth,async(req,res)=>{
    // console.log(req.body)
    let user = await User.findOne({loginemail:req.user.loginemail.toLowerCase()})
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

router.put('/addSubscription/:useremail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        var addSubscription=new Date(req.body.subscriptionEndDate)
        result = await User.updateMany({useremail:req.params.useremail.toLowerCase()},{subscriptionEndDate:addSubscription})
        res.send(result)
    }
    else{
        res.send({Status:"Unauthorized"})
    }

})

router.put('/selectSubscription',auth,async(req,res)=>{
    var result = await User.updateOne({useremail:req.user.useremail},{subscriptionType:req.body.subscriptionType})
    res.status(201).send({successMessage:"subscription successfully updated"})
})

router.get('/currentSubscription',auth,async(req,res)=>{
    var result = await User.findOne({useremail:req.user.useremail})
    res.status(200).send({subscriptionType:result.subscriptionType})
})


router.get('/getSubAccounts',auth,async(req,res)=>{
    subusers = await User.find({useremail:req.user.useremail.toLowerCase(),accountType:"sub"},{password:0,_id:0})
    res.send(subusers)
})

router.post('/addSubAccount',auth,async(req,res)=>{
    // console.log(req.body)
    if(req.user.accountType=="root"){
    var user = await User.findOne({$or:[{loginemail:req.body.loginemail.toLowerCase()},{loginemail:req.body.loginemail.toLowerCase(),username:req.body.username.toLowerCase()}] })
    if(user) return res.status(400).send({message:"User already exists"});

    user = new User({
        useremail:req.user.useremail,
        loginemail:req.body.loginemail,
        username:req.body.username,
        password:"password.123",
        accountType:"sub",
        Orders:req.body.Orders,
        Finance:req.body.Finance,
        DSCInventory:req.body.DSCInventory,
        GroupedInventory:req.body.GroupedInventory,
        Profitibility:req.body.Profitibility,
        ReturnsDispatch:req.body.ReturnsDispatch,
        subscriptionEndDate:req.user.subscriptionEndDate

    })

    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(user.password,salt);

    await user.save();
    res.send({message:'User Registered'});
    }
    else{
        res.send({message:'Unauthorized'})
    }


})

router.put('/updateSubAccount',auth,async(req,res)=>{
    updateResult = await User.updateOne({loginemail:req.body.loginemail.toLowerCase(),useremail:req.user.useremail.toLowerCase()},{
        username:req.body.username,
        Orders:req.body.Orders,
        Finance:req.body.Finance,
        DSCInventory:req.body.DSCInventory,
        GroupedInventory:req.body.GroupedInventory,
        Profitibility:req.body.Profitibility,
        ReturnsDispatch:req.body.ReturnsDispatch,
        subscriptionEndDate:req.user.subscriptionEndDate
    })

    res.send(updateResult)
})

router.post('/deleteSubAccount',auth,async(req,res)=>{
    deleteResult = await User.deleteOne({loginemail:req.body.loginemail.toLowerCase(),useremail:req.user.useremail.toLowerCase()})
    res.send(deleteResult)
})

router.put('/resetSubPassword/:loginemail',auth,async(req,res)=>{
    if(req.user.accountType=="root"){
        const salt = await bcrypt.genSalt(10);
        var password=await bcrypt.hash('password.123',salt)

        var update = await User.updateOne({loginemail:req.params.loginemail.toLowerCase()},{
            password:password
        });
        res.send(update)
        }
    else{
        res.send({Status:"Unauthorized"})
    }
})

module.exports = router;