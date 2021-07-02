const mongoose = require('mongoose');

const darazidSchema = new mongoose.Schema({
    shopid:String,
    secretkey:String,
    useremail:String,
    shopName:String,
    shopAddress:String,
    shopState:String,
    shopArea:String,
    shopLocation:String,
    shopPhone:String
})

const Darazid = mongoose.model('Darazapi',darazidSchema);

module.exports.Darazid = Darazid;

