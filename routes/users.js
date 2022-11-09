const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const { UserSubscription } = require('../models/userSubscription');
const { sendVerificationEmail,sendResetEmail, sendInvitationVerification } = require('../service/emailService');
const crypto = require('crypto');
const { Token } = require('../models/token');
const config = require('config');
const constants = require('../data/constants');
const moment = require('moment');
const { Lookup } = require('../models/lookup');

router.get('/',async(req,res)=>{
    const user =await User.find({accountType:"root"},{password:0,_id:0});
    res.send(user);
}
)

router.post('/addUser',auth,async(req,res)=>{
    if(req.user.userType=="admin"){
        let user =await User.findOne({$or:[{userEmail:req.body.userEmail.toLowerCase()},{loginEmail:req.body.userEmail.toLowerCase()}]});
        if (user) return res.status(400).send({message:"User already exists"}); 
            var userSubscription = new UserSubscription({
                userEmail:req.body.userEmail.toLowerCase()
            })
            userSubscription = await userSubscription.save();
            console.log(userSubscription)

            user = new User({
            userEmail:req.body.userEmail.toLowerCase(),
            userName:req.body.userName,
            loginEmail:req.body.userEmail.toLowerCase(),
            password:req.body.password,
            userType:req.body.userType,
            isVerified:true,
            permissions:req.body.permissions,
            subscription:userSubscription._id
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

router.post('/signup',async(req,res)=>{
        let user = await User.findOne({$or:[{userEmail:req.body.userEmail.toLowerCase()},{loginEmail:req.body.userEmail.toLowerCase()}],isVerified:true});
        if (user) return res.send({error:"User already exists"}); 

        user = await User.findOne({$or:[{userEmail:req.body.userEmail.toLowerCase()},{loginEmail:req.body.userEmail.toLowerCase()}],isVerified:false});
        if(!user){
            var {lookup_detail:trialPermissions} =await Lookup.findOne({lookup_key:constants.TRIAL_PERMISSIONS_LOOKUP})

            var userSubscription = new UserSubscription({
                userEmail:req.body.userEmail.toLowerCase(),
                startDate:moment(),
                endDate:moment().add(1,'month')
            })
            userSubscription = await userSubscription.save();
            console.log(userSubscription)

            user = new User({
                userEmail:req.body.userEmail.toLowerCase(),
                userName:req.body.userName,
                loginEmail:req.body.userEmail.toLowerCase(),
                userType:"user",
                permissions:trialPermissions,
                subscription:userSubscription._id
            })

        }
        const salt = await bcrypt.genSalt(10);
        user.password =await bcrypt.hash(req.body.userPassword,salt);
        user.userName=req.body.userName

        var savedUser = await user.save();

        let tokenString
        var tokenObj = await Token.findOne({userId:savedUser._id,tokenType:'signUp'})
        if(!tokenObj){
            tokenString = crypto.randomBytes(32).toString("hex")
            await new Token({
                userId:savedUser._id,
                token: tokenString,
                tokenType:'signUp'
            }).save()
        }else tokenString = tokenObj.token
    
        var link = config.baseUrl+"/login/register?token="+tokenString

        sendVerificationEmail(link,req.body.userEmail.toLowerCase())
        res.status(201).send({message:'User Registered'});
})

router.put('/verifyEmail',async(req,res)=>{
    console.log(req.body.token)
    var tokenObj = await Token.findOne({token:req.body.token,tokenType:'signUp'})
    if(!tokenObj) return res.send({status:"error",message:"Invalid or Expired Link"})

    var user = await User.findOne({_id:tokenObj.userId})
    user.isVerified = true

    await user.save()
    await tokenObj.delete()
    res.send({status:"success",message:"Verified. Please wait, you will be redirected to login page"})

})

router.put('/updateUser/:loginEmail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        // console.log(req.params.userEmail)
        var update = await User.updateOne({loginEmail:req.params.loginEmail.toLowerCase()},{
            userType:req.body.usertype,
            permissions:req.body.permissions
        });
        res.send(update)
    }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.put('/resetPassword/:loginEmail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        const salt = await bcrypt.genSalt(10);
        var password=await bcrypt.hash('password.123',salt)

        var update = await User.updateOne({loginEmail:req.params.loginEmail.toLowerCase()},{
            password:password
        });
        res.send(update)
        }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.post('/deleteUser',auth,async(req,res)=>{
    if(req.user.userType=="admin"){
        var del = await User.deleteMany({userEmail:req.body.userEmail.toLowerCase()})
        res.send(del)
    }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.put('/updatePassword',auth,async(req,res)=>{
    // console.log(req.body)
    let user = await User.findOne({loginEmail:req.user.loginEmail.toLowerCase()})
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

router.put('/addSubscription/:userEmail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        var addSubscription=new Date(req.body.subscriptionEndDate)
        result = await User.updateMany({userEmail:req.params.userEmail.toLowerCase()},{subscriptionEndDate:addSubscription})
        res.send(result)
    }
    else{
        res.send({Status:"Unauthorized"})
    }

})

router.put('/selectSubscription',auth,async(req,res)=>{
    var result = await User.updateOne({userEmail:req.user.userEmail},{subscriptionType:req.body.subscriptionType})
    res.status(201).send({successMessage:"subscription successfully updated"})
})

router.get('/currentSubscription',auth,async(req,res)=>{
    var result = await User.findOne({userEmail:req.user.userEmail})
    res.status(200).send({subscriptionType:result.subscriptionType})
})


router.get('/getSubAccounts',auth,async(req,res)=>{
    subusers = await User.find({userEmail:req.user.userEmail.toLowerCase(),accountType:"sub"},{password:0,_id:0})
    res.send(subusers)
})

router.post('/addSubAccount',auth,async(req,res)=>{
    // console.log(req.body)
    if(req.user.accountType=="root"){
    var user = await User.findOne({$or:[{loginEmail:req.body.loginEmail.toLowerCase()},{userEmail:req.body.loginEmail.toLowerCase()}] })
    if(user) return res.status(400).send({message:"User already exists"});
    var rootUser = await User.findOne({$and:[{loginEmail:req.user.userEmail.toLowerCase()},{userEmail:req.user.userEmail.toLowerCase()}],accountType:'root'})

    user = new User({
        userEmail:req.user.userEmail,
        loginEmail:req.body.loginEmail,
        userName:req.body.userName,
        password:"password.123",
        accountType:"sub",
        permissions:req.body.permissions,
        subscription:rootUser.subscription

    })

    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(user.password,salt);
    if(req.body.bypassSubAccVerification) user.isVerified = true
    else{
        var tokenObj = await Token.findOne({userId:user._id,tokenType:'createSubAccount'})
        if(!tokenObj){
            tokenString = crypto.randomBytes(32).toString("hex")
            await new Token({
                userId:user._id,
                token: tokenString,
                tokenType:'createSubAccount'
            }).save()
        }else tokenString = tokenObj.token
    
        var link = config.baseUrl+"/login/verifyAndActiveAccount?token="+tokenString
    
        sendInvitationVerification(req.body.loginEmail,link,rootUser.userName)
    } 
    
    await user.save();
    res.send({message:'User Registered'});

    }
    else{
        res.send({message:'Unauthorized'})
    }


})

router.get('/getSubAccountWithToken/:token',async(req,res)=>{
    var userToken = await Token.findOne({token:req.params.token,tokenType:"createSubAccount"})
    var user;
    if(userToken){
        user = await User.findOne({_id:userToken.userId})
        if(user) return res.status(200).send({status:"success",user:user})
    }else {
        res.status(200).send({status:"error",message:"Incorrect Or Expired Invitation Link"})
    }
})

router.post('/verifySubAccountWithToken/:token',async(req,res)=>{
    console.log(req.params.token)
    var userToken = await Token.findOne({token:req.params.token,tokenType:"createSubAccount"})
    var user;
    if(userToken){
        user = await User.findOne({_id:userToken.userId,loginEmail:req.body.loginEmail})
        if(user){
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.userPassword,salt);
            user.isVerified=true
            user.userName=req.body.userName;
            await user.save();
            await userToken.delete()
            return res.status(200).send({status:"success",message:"Registration Completed Successfully, You Will Be Redirected To Login Page"})
        } 
    }else {
        res.status(200).send({status:"error",message:"Incorrect Or Expired Invitation Link"})
    }
})

router.put('/updateSubAccount',auth,async(req,res)=>{
    updateResult = await User.updateOne({loginEmail:req.body.loginEmail.toLowerCase(),userEmail:req.user.userEmail.toLowerCase()},{
        userName:req.body.userName,
        permissions:req.body.permissions
    })

    res.send(updateResult)
})

router.post('/deleteSubAccount',auth,async(req,res)=>{
    deleteResult = await User.deleteOne({loginEmail:req.body.loginEmail.toLowerCase(),userEmail:req.user.userEmail.toLowerCase()})
    res.send(deleteResult)
})

router.put('/resetSubPassword/:loginEmail',auth,async(req,res)=>{
    if(req.user.accountType=="root"){
        const salt = await bcrypt.genSalt(10);
        var password=await bcrypt.hash('password.123',salt)

        var update = await User.updateOne({loginEmail:req.params.loginEmail.toLowerCase()},{
            password:password
        });
        res.send(update)
        }
    else{
        res.send({Status:"Unauthorized"})
    }
})

router.post('/recoverPassword',async(req,res)=>{
    var user = await User.findOne({loginEmail:req.body.resetEmail.toLowerCase()})
    console.log(user)
    if(!user) return res.send({status:"error",message:"Account does not exist"})

    
    let tokenString
    var tokenObj = await Token.findOne({userId:user._id,tokenType:'recoverPassword'})
    if(!tokenObj){
        tokenString = crypto.randomBytes(32).toString("hex")
        await new Token({
            userId:user._id,
            token: tokenString,
            tokenType:'recoverPassword'
        }).save()
    }else tokenString = tokenObj.token

    var link = config.baseUrl+"/login/recoverPassword?token="+tokenString

    sendResetEmail(req.body.resetEmail,link)
    res.send({status:"success",message:"Reset Link is sent to your email"})
})

router.put('/resetPasswordWithToken/:token',async(req,res)=>{
    var tokenObj = await Token.findOne({token:req.params.token,tokenType:'recoverPassword'})
    if(!tokenObj) return res.send({status:"error",message:"Invalid or Expired Link"})

    var user = await User.findOne({_id:tokenObj.userId})
    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(req.body.userPassword,salt);

    await user.save()
    await tokenObj.delete()
    res.send({status:"success",message:"Password Changed Successfully, You will be redirected to Login Page"})
})

module.exports = router;