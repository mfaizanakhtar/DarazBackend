const { Schema } = require('mongoose')
const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    token:{
        type:String,
        required:true
    },
    tokenType:String,
    createdAt:{
        type:Date,
        default:Date.now,
        expires:3600
    }
})

const Token = new mongoose.model('Token',tokenSchema)

module.exports.Token = Token;