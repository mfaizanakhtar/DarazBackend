const LazadaAPI = require('lazada-open-platform-sdk');
const moment = require('moment');
const { darazOpenAppDetails } = require('./data');
const {SignParameters} = require('./signParameters');

var baseUrl="https://api.daraz.pk/rest";

function generateAccessTokenUrl(callBackCode){
    var accessTokenUrl="/auth/token/create"
    var params = {...getStandardParams(),code:callBackCode};
    var formattedParams=sortAndFormatParams(params);
    var url = baseUrl+accessTokenUrl+formattedParams.queryParams+"&sign="+SignParameters(darazOpenAppDetails.appSecret,accessTokenUrl+formattedParams.concatenatedParams);
    
    return url;
}

function getSellerUrl(access_token){
    
    var getSellerUrl="/seller/get"
    var params = {...getStandardParams(),access_token:access_token};
    var formattedParams=sortAndFormatParams(params);

    var url = baseUrl+getSellerUrl+formattedParams.queryParams+"&sign="+SignParameters(darazOpenAppDetails.appSecret,getSellerUrl+formattedParams.concatenatedParams);
   
    return url;
}

function sortAndFormatParams(params){
    var concatenatedParams=""
    var queryParams=""
    var i=0;

    Object.keys(params).sort().reduce((accumulator,currVal)=>{
        accumulator[currVal] = params[currVal];

        var paramsLength=Object.keys(params).length
        concatenatedParams=concatenatedParams+currVal+params[currVal]
        if(i!=paramsLength && i!=0){
            queryParams=queryParams+"&"
        }
        if(i==0){
            queryParams=queryParams+"?"
        }
        queryParams=queryParams+currVal+"="+params[currVal]
        
        i++
        return accumulator;
    },{})

    return {concatenatedParams:concatenatedParams,queryParams:queryParams}
}

function getStandardParams(){
    return {app_key:darazOpenAppDetails.appKey,timestamp:moment(),sign_method:"sha256"};
}


function generateTransactionsUrl(userid,secretkey,date,transType){
    var url="https://api.sellercenter.daraz.pk?"
    Action="Action=GetTransactionDetails"
    Timestamp=getTimeStamp();

    let userID=encodeURIComponent(userid);
    apiparams=Action+"&Format=json"+"&Timestamp="+Timestamp+"&UserID="+userID+
    "&Version=1.0"+"&endTime="+date+"&startTime="+date+"&transType="+transType
    url=url+apiparams+"&"+"Signature="+SignParameters(secretkey,apiparams)
    // console.log(url)
    return url

}

function generateSkuUrl(userid,secretkey,Skus){
    var url="https://api.sellercenter.daraz.pk?"
    Action="Action=GetProducts"
    Timestamp=getTimeStamp();

    let userID=encodeURIComponent(userid);
    let encodedSkus = encodeURIComponent(Skus)
    var apiparams
    if(Skus!=undefined){
        apiparams=Action+"&Filter=all&Format=json"+"&SkuSellerList="+encodedSkus+"&Timestamp="+Timestamp+"&UserID="+userID+
        "&Version=1.0"
    }
    else if(Skus==undefined){
        apiparams=Action+"&Filter=all&Format=json"+"&Timestamp="+Timestamp+"&UserID="+userID+
        "&Version=1.0"
    }
    url=url+apiparams+"&"+"Signature="+SignParameters(secretkey,apiparams)
    // console.log(url)
    return url
}


function generateOrdersUrl(access_token,offSet){

    var getOrdersUrl="/orders/get";
    var params = {...getStandardParams(),access_token:access_token,sort_by:"created_at",sort_direction:"DESC",limit:100,offset:offSet,created_after:moment().subtract(365,"days").toISOString()};
    var formattedParams=sortAndFormatParams(params);

    var url = baseUrl+getOrdersUrl+formattedParams.queryParams+"&sign="+SignParameters(darazOpenAppDetails.appSecret,getOrdersUrl+formattedParams.concatenatedParams);
   
    console.log(url)
    return url;
    

}

function generateSingleOrderUrl(shopid,secretkey,Orderid){
    //To get Single Order Detail with Order ID argument

    //base URL
    const url="https://api.sellercenter.daraz.pk?";
    //TimeStamp as per daraz
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');

    //encode userid(email)
    let userID=encodeURIComponent(shopid);
    //Action of API
    let Action='GetOrder';
    //Api paramaters formation
    let apiparams='Action='+Action+'&Format=json'+'&OrderId='+Orderid+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    //Sign parameters and concatenate with base URL
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

}

function generateMultipleOrderItemsUrl(userid,secretkey,Orders){
    //to get OrderItemsUrl from OrderID

    const url="https://api.sellercenter.daraz.pk?";
    createdAfter=encodeURIComponent(new Date('02-25-2014').toISOString().substr(0,19)+'+00:00');
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');


    let userID=encodeURIComponent(userid);

    let Action='GetMultipleOrderItems';
    let orders = encodeURIComponent(Orders);

    let apiparams='Action='+Action+'&Format=json'+'&OrderIdList='+orders+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

}

function generateLabelUrl(userid,secretkey,OrderItemIds){
    const url="https://api.sellercenter.daraz.pk?";
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');
    let Action = 'GetDocument';
    OrderItemIds=encodeURIComponent(OrderItemIds)

    let userID=encodeURIComponent(userid);

    let apiparams='Action='+Action+'&DocumentType=shippingLabel'+'&Format=json'+'&OrderItemIds='+OrderItemIds+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);

}

function RtsURL(userid,secretkey,OrderItemIds){
    const url="https://api.sellercenter.daraz.pk?";
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');
    let Action = 'SetStatusToReadyToShip';
    OrderItemIds=encodeURIComponent(OrderItemIds)

    let userID=encodeURIComponent(userid);

    let apiparams='Action='+Action+'&DeliveryType=dropship'+'&Format=json'+'&OrderItemIds='+OrderItemIds+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
}

function getTimeStamp(){
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00')
    return Timestamp;
}
function getOrderIdArray(data){

var orderids='['
for(var element of data){
    orderids+=element.OrderId+',';
    
};
orderids+=']'
return orderids;
}

module.exports.generateTransactionsUrl = generateTransactionsUrl;
module.exports.generateOrdersUrl = generateOrdersUrl;
module.exports.generateSingleOrderUrl = generateSingleOrderUrl;
module.exports.generateMultipleOrderItemsUrl = generateMultipleOrderItemsUrl;
module.exports.getOrderIdArray = getOrderIdArray;
module.exports.generateLabelUrl = generateLabelUrl;
module.exports.RtsURL = RtsURL;
module.exports.generateSkuUrl = generateSkuUrl
module.exports.generateAccessTokenUrl = generateAccessTokenUrl;
module.exports.getSellerUrl = getSellerUrl;