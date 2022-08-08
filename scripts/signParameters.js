const crypto = require('crypto');


function SignParameters(secretkey,param){
    //signing parameters
    return crypto.createHmac("sha256",secretkey)
    .update(param)
    .digest("hex").toUpperCase();
}

module.exports.SignParameters = SignParameters;