const mongoose = require('mongoose');

const darazidSchema = new mongoose.Schema({
    shopid:String,
    secretkey:String,
    useremail:String
})

const Darazid = mongoose.model('Darazapi',darazidSchema);

module.exports.Darazid = Darazid;

