const crypto = require('crypto');
const moment = require('moment');
const { Lookup } = require('../models/lookup');


function SignParameters(secretkey,param){
    //signing parameters
    return crypto.createHmac("sha256",secretkey)
    .update(param)
    .digest("hex").toUpperCase();
}

function getDateFilter(query){
    if(query.startDate=='undefined' || !query.endDate=='undefined') return {}
    let startdate=moment(query.startDate).toDate()
    let enddate=moment(query.endDate).toDate()
    console.log(startdate)
    console.log(enddate)

    return {$and:[{CreatedAt:{$gte:startdate}},{CreatedAt:{$lte:enddate}}]}
    
}

function replaceUnderScoreKeysToDollar(object){
    for(let key of Object.keys(object)){
        if(Array.isArray(object[key])){
            for(arrayObj of object[key]){
                replaceUnderScoreKeysToDollar(arrayObj)
            }
        }
        let replacedDollarKey=key.replace('_','$')
        if(replacedDollarKey!=key){
            object[replacedDollarKey]=object[key]
            delete object[key]
        }
        let replacedDOTKey=replacedDollarKey.replace('DOT','.')
        if(replacedDOTKey!=replacedDollarKey){
            object[replacedDOTKey]=object[key]
            delete object[key]
        }
        if(!(typeof object[replacedDOTKey] === 'object')){
             return
        }
        replaceUnderScoreKeysToDollar(object[replacedDOTKey])
    }
    return object
}

async function getLookupValue(lookupKey){
    let lookupObj = await Lookup.findOne({lookup_key:lookupKey});
    if(lookupObj?.lookup_detail) return lookupObj.lookup_detail
    else return {};
}

module.exports.SignParameters = SignParameters;
module.exports.replaceUnderScoreKeysToDollar = replaceUnderScoreKeysToDollar;
module.exports.getDateFilter = getDateFilter;
module.exports.getLookupValue = getLookupValue;