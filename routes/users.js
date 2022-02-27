const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const { UserSubscription } = require('../models/userSubscription');
const { sendVerificationEmail,sendResetEmail } = require('../service/emailService');
const crypto = require('crypto');
const { Token } = require('../models/token');
const config = require('config');

router.get('/',async(req,res)=>{
    const user =await User.find({accountType:"root"},{password:0,_id:0});
    res.send(user);
}
)

router.post('/',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        let user =await User.findOne({$or:[{useremail:req.body.useremail.toLowerCase()},{loginemail:req.body.useremail.toLowerCase()}]});
        if (user) return res.status(400).send({message:"User already exists"}); 
            var userSubscription = new UserSubscription({
                userEmail:req.body.useremail.toLowerCase()
            })
            userSubscription = await userSubscription.save();
            console.log(userSubscription)

            user = new User({
            useremail:req.body.useremail.toLowerCase(),
            loginemail:req.body.useremail.toLowerCase(),
            password:req.body.password,
            usertype:req.body.usertype,
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
        let user = await User.findOne({$or:[{useremail:req.body.userEmail.toLowerCase()},{loginemail:req.body.userEmail.toLowerCase()}],isVerified:true});
        if (user) return res.send({error:"User already exists"}); 

        var verificationCode = Math.floor(Math.random() * (999999 - 99999) ) + 99999;
        var verificationExpiry=new Date(new Date().getTime() + 10*60000);
        var verificationObj={code:verificationCode,expiry:verificationExpiry}

        user = await User.findOne({$or:[{useremail:req.body.userEmail.toLowerCase()},{loginemail:req.body.userEmail.toLowerCase()}],isVerified:false});
        if(!user){

            var userSubscription = new UserSubscription({
                userEmail:req.body.userEmail.toLowerCase()
            })
            userSubscription = await userSubscription.save();
            console.log(userSubscription)

            user = new User({
                useremail:req.body.userEmail.toLowerCase(),
                username:req.body.userName,
                loginemail:req.body.userEmail.toLowerCase(),
                usertype:"user",
                subscription:userSubscription._id
            })

        }
        const salt = await bcrypt.genSalt(10);
        user.password =await bcrypt.hash(req.body.userPassword,salt);
        user.username=req.body.userName
        user.verification = verificationObj

        await user.save();
        sendVerificationEmail(verificationCode,req.body.userEmail.toLowerCase())
        res.status(201).send({message:'User Registered'});
})

router.put('/verifyEmail',async(req,res)=>{
    console.log(req.body)
    let user = await User.findOne({$or:[{useremail:req.body.userEmail.toLowerCase()},{loginemail:req.body.userEmail.toLowerCase()}],isVerified:false})
    if(user){
        if(user.verification!=null){
           if(user.verification.expiry>=new Date()){
               if(user.verification.code==req.body.verificationCode){
                user.isVerified=true
                user.save()
                return res.send({status:"success",message:"Successfully Verified. Please wait, you will be directed to login page"})
               }
               return res.send({status:"error",message:"Incorrect Verification Code. Please Try Again"})   
           }
           return res.send({status:"error",message:"Verification Code Expired."})
        }
    }
    return res.send({status:"error",message:"User already verified or does not exist. Please proceed to Signup"})
})

router.put('/updateUser/:loginemail',auth,async(req,res)=>{
    if(req.user.usertype=="admin"){
        // console.log(req.params.useremail)
        var update = await User.updateOne({loginemail:req.params.loginemail.toLowerCase()},{
            usertype:req.body.usertype,
            permissions:req.body.permissions
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
        permissions:req.body.permissions

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
        permissions:req.body.permissions
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

router.post('/recoverPassword',async(req,res)=>{
    var user = await User.findOne({loginemail:req.body.resetEmail.toLowerCase()})
    console.log(user)
    if(!user) return res.send({status:"error",message:"Account does not exist"})

    
    let tokenString
    var tokenObj = await Token.findOne({userId:user._id})
    if(!tokenObj){
        tokenString = crypto.randomBytes(32).toString("hex")
        await new Token({
            userId:user._id,
            token: tokenString
        }).save()
    }else tokenString = tokenObj.token

    var link = config.baseUrl+"/login/recoverPassword?token="+tokenString

    sendResetEmail(req.body.resetEmail,link)
    res.send({status:"success",message:"Reset Link is sent to your email"})
})

router.put('/resetPasswordWithToken/:token',async(req,res)=>{
    var tokenObj = await Token.findOne({token:req.params.token})
    if(!tokenObj) return res.send({status:"error",message:"Invalid or Expired Link"})

    var user = await User.findOne({_id:tokenObj.userId})
    const salt = await bcrypt.genSalt(10);
    user.password =await bcrypt.hash(req.body.userPassword,salt);

    await user.save()
    await tokenObj.delete()
    res.send({status:"sucess",message:"Password Changed Successfully, You will be redirected to Login Page"})
})

module.exports = router;