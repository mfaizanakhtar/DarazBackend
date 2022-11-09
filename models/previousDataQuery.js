const mongoose = require('mongoose');

const previousQuerySchema = new mongoose.Schema({
    shopShortCode:String,
    queryData:mongoose.Schema.Types.Mixed,
    queryType:String,
    createdAt:{
        type:Date,
        default:Date.now,
        expires:2*24*60*60
    }
})


const previousDataQuery = new mongoose.model('previousDataQuery',previousQuerySchema);

module.exports.previousDataQuery = previousDataQuery;