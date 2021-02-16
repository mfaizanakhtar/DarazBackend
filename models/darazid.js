const mongoose = require('mongoose');

const darazidSchema = new mongoose.Schema({
    emailid:String,
    secretkey:String
})

const Darazid = mongoose.model('Darazapi',darazidSchema);

module.exports.Darazid = Darazid;

