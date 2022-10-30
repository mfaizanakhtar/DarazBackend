const mongoose = require('mongoose');

const lookupSchema = new mongoose.Schema({
    lookup_key:{type:String,unique:true},
    lookup_detail:Object
})

const Lookup = new mongoose.model('lookup',lookupSchema)

module.exports.Lookup = Lookup