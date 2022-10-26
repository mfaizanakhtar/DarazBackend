const mongoose = require('mongoose');

const previousQuerySchema = new mongoose.Schema({
    shopShortCode:String,
    queryData:mongoose.Schema.Types.Mixed,
    queryType:String,
    createdAt:{
        type:Date,
        default:Date.now,
        expires:24*60*60*1000
    }
})


const previousDataQuery = new mongoose.model('previousDataQuery',previousQuerySchema);

module.exports.previousDataQuery = previousDataQuery;