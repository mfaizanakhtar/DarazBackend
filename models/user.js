const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
    userid:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    usertype:{
        type:String,
        required:true,
    }
})

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({_id:this._id,usertype:this.usertype},config.get("jwtprivatekey"),{expiresIn:"15m"});
    return token;
}

const User = mongoose.model('User',userSchema);

module.exports.User = User