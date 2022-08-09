const mongoose = require('mongoose');

const previousQuerySchema = new mongoose.Schema({
    shopShortCode:String,
    queryData:mongoose.Schema.Types.Mixed,
    queryType:String
})


const previousDataQuery = new mongoose.model('previousDataQuery',previousQuerySchema);

module.exports.previousDataQuery = previousDataQuery;