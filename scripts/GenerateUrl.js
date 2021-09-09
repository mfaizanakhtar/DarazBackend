const {SignParameters} = require('./signParameters');


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
    apiparams=Action+"&Filter=all&Format=json"+"&SkuSellerList="+encodedSkus+"&Timestamp="+Timestamp+"&UserID="+userID+
    "&Version=1.0"
    url=url+apiparams+"&"+"Signature="+SignParameters(secretkey,apiparams)
    // console.log(url)
    return url
}


function generateOrdersUrl(userid,secretkey,Offset){
    //To get multiple orders (100 latest with 0 offset)

    //base URL
    const url="https://api.sellercenter.daraz.pk?";
    //Created After as per daraz requirement and encoded
    createdAfter=encodeURIComponent(new Date('02-25-2014').toISOString().substr(0,19)+'+00:00');
    //TimeStamp as per daraz requirement and encoded    
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');

    //UserId Encoded
    let userID=encodeURIComponent(userid);
    //Action of API
    let Action='GetOrders';
    //parameters created, signed and concatenated with URL and returned
    let apiparams='Action='+Action+'&CreatedAfter='+createdAfter+'&Format=json'+'&Offset='+Offset+'&SortBy=created_at'+'&SortDirection=DESC'+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

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