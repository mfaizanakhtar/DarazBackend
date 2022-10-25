const crypto = require('crypto');
const moment = require('moment');


function SignParameters(secretkey,param){
    //signing parameters
    return crypto.createHmac("sha256",secretkey)
    .update(param)
    .digest("hex").toUpperCase();
}

function getDateFilter(query){

    let startdate=query.startDate
    let enddate=query.startDate
    console.log(startdate)
    console.log(enddate)

    return {$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    
}

function getDateFilterTransactions(query){

    let startdate=moment(query.startDate).startOf('day').toDate()
    let enddate=moment(query.endDate).endOf('day').toDate()
    console.log(startdate)
    console.log(enddate)

    return {startDate:startdate,endDate:enddate}
    
}

module.exports.SignParameters = SignParameters;
module.exports.getDateFilter = getDateFilter;
module.exports.getDateFilterTransactions = getDateFilterTransactions;