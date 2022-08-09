const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');
const { mongo } = require('mongoose');


const userSchema = new mongoose.Schema({
    loginEmail:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        default:'admin'
    },
    userEmail:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    userType:{
        type:String,
        default:"user"
    },
    accountType:{
        type:String,
        default:"root"
    },
    isVerified:{type:Boolean,default:false},
    isActive:{type:Boolean,default:true},
    verification:{type:Object,default:null},
    permissions:Object,
    subscription:{type:mongoose.Schema.Types.ObjectId,ref:'UserSubscription'},
    subscriptionEndDate:{type:Date,default:() => Date.now() + 7*24*60*60*1000},
    subscriptionType:String
})

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({_id:this._id,userEmail:this.userEmail,userName:this.userName,loginEmail:this.loginEmail,
        userType:this.userType,accountType:this.accountType,permissions:this.permissions,
        subscriptionEndDate:this.subscriptionEndDate,subscriptionType:this.subscriptionType},config.get("jwtprivatekey"),{expiresIn:"1d"});
    return token;
}

const User = mongoose.model('User',userSchema);

module.exports.User = User