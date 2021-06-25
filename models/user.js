const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');
const { mongo } = require('mongoose');


const userSchema = new mongoose.Schema({
    useremail:{
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
    const token = jwt.sign({_id:this._id,useremail:this.useremail,usertype:this.usertype},config.get("jwtprivatekey"),{expiresIn:"1d"});
    return token;
}

const User = mongoose.model('User',userSchema);

module.exports.User = User