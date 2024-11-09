const LazadaAPI = require('lazada-open-platform-sdk');
const moment = require('moment');
const { darazOpenAppDetails } = require('../data/data');
const {SignParameters} = require('./utils');

var baseUrl="https://api.daraz.pk/rest";

function generateAccessTokenUrl(callBackCode){
    var accessTokenUrl="/auth/token/create"
    var params = {code:callBackCode};    
    return createGetUrl(accessTokenUrl,params)
}

function getRefreshAccessTokenUrl(refresh_token){
    
    var getRefreshAccessTokenUrl="/auth/token/refresh"
    var params = {refresh_token:refresh_token};   
    return createGetUrl(getRefreshAccessTokenUrl,params)
}
function postUpdatePriceQuantity(access_token,payload){

    
    var postUpdatePriceQuantityUrl="/product/price_quantity/update"
    var params = {access_token:access_token,payload:payload};   
    return createGetUrl(postUpdatePriceQuantityUrl,params)
}

function getSellerUrl(access_token){
    
    var getSellerUrl="/seller/get"
    var params = {access_token:access_token};   
    return createGetUrl(getSellerUrl,params)
}

function generateOrdersUrl(access_token,offSet,orderStatus){

    var getOrdersUrl="/orders/get";
    var params = {access_token:access_token,sort_by:"created_at",sort_direction:"DESC",limit:100,offset:offSet,created_after:moment().subtract(365,"days").toISOString()};
    if(orderStatus) params={...params,status:orderStatus};
    return createGetUrl(getOrdersUrl,params);    

}

function generateMultipleOrderItemsUrl(accessToken,orderIds){
    var getMultiplOrderItemsUrl="/orders/items/get";
    var params = {access_token:accessToken,order_ids:orderIds};
    return createGetUrl(getMultiplOrderItemsUrl,params)
    
}

function generateTransactionsUrl(accessToken,transType,startTime,endTime,limit,offSet){
    var getTransactionDetailsUrl="/finance/transaction/details/get"
    var params = {access_token:accessToken,trans_type:transType,start_time:startTime,end_time:endTime,limit:limit,offset:offSet};

    return createGetUrl(getTransactionDetailsUrl,params)
}

function RtsURL(accessToken,OrderItemIds){
    var setRtsUrl="/order/rts"
    var params = {access_token:accessToken,order_item_ids:OrderItemIds,delivery_type:"dropship",shipment_provider:"daraz",tracking_number:"daraz"};

    return createGetUrl(setRtsUrl,params)
}

function generateLabelUrl(accessToken,OrderItemIds,docType){
    var getDocumentUrl="/order/document/get"
    var params = {access_token:accessToken,order_item_ids:OrderItemIds,doc_type:docType};

    return createGetUrl(getDocumentUrl,params)

}

function generateSkuUrl(accessToken,filter,limit,offset,Skus){
    var getSkuUrl="/products/get";
    var params={access_token:accessToken,filter:filter,options:1,offset:offset}
    if(limit && limit>0){
        params={...params,limit:limit}
    }
    if(Skus!=null){
        params={...params,sku_seller_list:Skus}
    }
    return createGetUrl(getSkuUrl,params);
}

function createGetUrl(apiUrl,extraParams){
    var params = getStandardParams()
    if(extraParams!=null){
        params={...params,...extraParams}
    }

    var formattedParams=sortAndFormatParams(params);

    var url = baseUrl+apiUrl+formattedParams.queryParams+"&sign="+SignParameters(darazOpenAppDetails.appSecret,apiUrl+formattedParams.concatenatedParams);
   
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
        queryParams=queryParams+currVal+"="+((currVal=="sku_seller_list" || currVal=="order_item_ids" || currVal=="payload") ? encodeURIComponent(params[currVal]) : params[currVal])
        
        i++
        return accumulator;
    },{})

    return {concatenatedParams:concatenatedParams,queryParams:queryParams}
}

function getStandardParams(){
    return {app_key:darazOpenAppDetails.appKey,timestamp:moment(),sign_method:"sha256"};
}



module.exports.generateTransactionsUrl = generateTransactionsUrl;
module.exports.generateOrdersUrl = generateOrdersUrl;
module.exports.generateMultipleOrderItemsUrl = generateMultipleOrderItemsUrl;
module.exports.generateLabelUrl = generateLabelUrl;
module.exports.RtsURL = RtsURL;
module.exports.generateSkuUrl = generateSkuUrl
module.exports.generateAccessTokenUrl = generateAccessTokenUrl;
module.exports.getSellerUrl = getSellerUrl;
module.exports.getRefreshAccessTokenUrl = getRefreshAccessTokenUrl;
module.exports.postUpdatePriceQuantity = postUpdatePriceQuantity;