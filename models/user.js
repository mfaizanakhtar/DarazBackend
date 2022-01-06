const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');
const { mongo } = require('mongoose');


const userSchema = new mongoose.Schema({
    loginemail:{
        type:String,
        required:true
    },
    username:{
        type:String,
        default:'admin'
    },
    useremail:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    usertype:{
        type:String,
        default:"user"
    },
    accountType:{
        type:String,
        default:"root"
    },
    Orders:{type:Boolean,default:true},
    Finance:{type:Boolean,default:true},
    DSCInventory:{type:Boolean,default:true},
    GroupedInventory:{type:Boolean,default:true},
    Profitibility:{type:Boolean,default:true},
    ReturnsDispatch:{type:Boolean,default:true},
    subscription:{type:mongoose.Schema.Types.ObjectId,ref:'userSubscription'},
    // subscriptionEndDate:{type:Date,default:() => Date.now() + 7*24*60*60*1000},
    // subscriptionType:String
})

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({_id:this._id,useremail:this.useremail,username:this.username,loginemail:this.loginemail,
        usertype:this.usertype,accountType:this.accountType,
        Orders:this.Orders,Finance:this.Finance,DSCInventory:this.DSCInventory,GroupedInventory:this.GroupedInventory,
        Profitibility:this.Profitibility,ReturnsDispatch:this.ReturnsDispatch,
        subscriptionEndDate:this.subscriptionEndDate,subscriptionType:this.subscriptionType},config.get("jwtprivatekey"),{expiresIn:"1d"});
    return token;
}

const User = mongoose.model('User',userSchema);

module.exports.User = User