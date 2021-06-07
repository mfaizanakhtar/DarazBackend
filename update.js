const axios = require('axios');
const crypto = require('crypto');
const { server } = require('./index');
const { Order } = require('./models/order');
const { Darazid } = require('./models/darazid');



function generateOrdersUrl(userid,secretkey,Offset){

    const url="https://api.sellercenter.daraz.pk?";
    createdAfter=encodeURIComponent(new Date('02-25-2014').toISOString().substr(0,19)+'+00:00');
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');


    let userID=encodeURIComponent(userid);

    let Action='GetOrders';

    let apiparams='Action='+Action+'&CreatedAfter='+createdAfter+'&Format=json'+'&Offset='+Offset+'&SortBy=created_at'+'&SortDirection=DESC'+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

}

function generateOrderUrl(userid,secretkey,Orderid){

    const url="https://api.sellercenter.daraz.pk?";
    // createdAfter=encodeURIComponent(new Date('02-25-2014').toISOString().substr(0,19)+'+00:00');
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');


    let userID=encodeURIComponent(userid);

    let Action='GetOrder';

    let apiparams='Action='+Action+'&Format=json'+'&OrderId='+Orderid+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

}

function generateMultipleOrderItemsUrl(userid,secretkey,Orders){

    const url="https://api.sellercenter.daraz.pk?";
    createdAfter=encodeURIComponent(new Date('02-25-2014').toISOString().substr(0,19)+'+00:00');
    Timestamp=encodeURIComponent(new Date().toISOString().substr(0,19)+'+00:00');


    let userID=encodeURIComponent(userid);

    let Action='GetMultipleOrderItems';
    let orders = encodeURIComponent(Orders);

    let apiparams='Action='+Action+'&Format=json'+'&OrderIdList='+orders+'&Timestamp='+Timestamp+'&UserID='+userID+'&Version=1.0'
    return url+apiparams+'&Signature='+SignParameters(secretkey,apiparams);
    

}




GetData = async (url)=> {
        
        try{
            const response = await axios.get(url);
            // const data = response.data.SuccessResponse.Body.Orders;
            const data = response.data.SuccessResponse.Body;
            // console.log(response);

            return data
            
        }
        catch(error){
            console.log(error);
        }
    }
    


function SignParameters(secretkey,param){

        return crypto.createHmac("sha256",secretkey)
        .update(param)
        .digest("hex");
 }

getApiIds = async()=>{
    var darazids = await Darazid.find();
    // console.log(darazids);
    return darazids;

}

async function UpdateData(){

    try{
    var userids = await getApiIds()
    
    for(const id of userids){
        // console.log(id);
    let url = generateOrdersUrl(id.emailid,id.secretkey,0);
    var data = await GetData(url);
    data = await getOrderData(id.emailid,id.secretkey,data.Orders)
    // console.log(data);
    for(const orders of data.Orders){
        for(var orderitems of orders.OrderItems){
        var result = await Order.findOne({OrderItemId: orderitems.OrderItemId})
        // console.log(result);
        if(!result){
            // console.log(orderitems);
            var order = new Order({
                OrderId:orderitems.OrderId,
                OrderItemId:orderitems.OrderItemId,
                ShopId:id.emailid,
                Name:orderitems.Name,
                Sku:orderitems.Sku,
                ShopSku:orderitems.ShopSku,
                ShippingType:orderitems.ShippingType,
                ItemPrice:orderitems.ItemPrice,
                ShippingAmount:orderitems.ShippingAmount,
                Status:orderitems.Status,
                TrackingCode:orderitems.TrackingCode,
                ShippingProviderType:orderitems.ShippingProviderType,
                CreatedAt:orderitems.CreatedAt,
                UpdatedAt:orderitems.UpdatedAt,
                productMainImage:orderitems.productMainImage,
                Variation:orderitems.Variation
            })
            var result = await order.save();
            // console.log(result);
        }
    }
        
    //     try{
    //     let response = await axios.post('http://localhost:3000/api/orders/',{
    //         OrderId:orderitems.OrderId,
    //         OrderItemId:orderitems.OrderItemId,
    //         ShopId:id.emailid,
    //         Name:orderitems.Name,
    //         Sku:orderitems.Sku,
    //         ShopSku:orderitems.ShopSku,
    //         ShippingType:orderitems.ShippingType,
    //         ItemPrice:orderitems.ItemPrice,
    //         ShippingAmount:orderitems.ShippingAmount,
    //         Status:orderitems.Status,
    //         TrackingCode:orderitems.TrackingCode,
    //         ShippingProviderType:orderitems.ShippingProviderType,
    //         CreatedAt:orderitems.CreatedAt,
    //         UpdatedAt:orderitems.UpdatedAt,
    //         productMainImage:orderitems.productMainImage,
    //         Variation:orderitems.Variation
    //     })
    //     // console.log(orderitems);
    // }
    // catch(error){
        
    // }
    };
}
    }
    catch(ex){
        console.log(ex.message);
    }
    
    console.log("Data Loop done");
    try {
        setTimeout(()=>{
            UpdateData();
        },300000);
    } catch (error) {
        console.log(error);
    }
}

async function updateStatus(){
    var orders = await Order.find({$or:[{Status:'shipped'},{ Status:'ready_to_ship'}]})
    for(const order of orders){
        
        var darazid = await Darazid.findOne({emailid:order.ShopId});
//Updating tracking of each pending/shipped order if any changes 
        url = await generateMultipleOrderItemsUrl(darazid.emailid,darazid.secretkey,"["+order.OrderId+"]");
        orderitemsdata = await GetData(url);
        try{
        for(const order of orderitemsdata.Orders[0].OrderItems)
        {
            


            var findorder = await Order.findOne({OrderItemId:order.OrderItemId});
            //updating statuses
            if(findorder.Status!=order.Status){
                console.log(findorder.Status+" "+order.Status);
                findorder.Status=order.Status;
                const result = await findorder.save();
            }
            //Update Tracking if tracking available
            if(findorder.TrackingCode==""){
                if(order.TrackingCode!="")
                {
                    findorder.TrackingCode=order.TrackingCode;
                    const result = await findorder.save();
                    // console.log(result);
                }
                
            }
             //New Updated Tracking if changed
            else if(findorder.TrackingCode!=order.TrackingCode)
            {
               
                findorder.UpdatedTracking=order.TrackingCode;
                const result = await findorder.save();
                // console.log(result);
            }
        }
    }
    catch(error){
        // console.log(error);
    }
        
        

       


    }
    console.log("Status Loop done");

    try {
        setTimeout(()=>{
            updateStatus();
        },10000);
    } catch (error) {
        console.log(error);
    }
    
    
}

async function updatePending(){
    var orders = await Order.find({Status:'pending'})
    for(const order of orders){
        
        var darazid = await Darazid.findOne({emailid:order.ShopId});
//Updating tracking of each pending/shipped order if any changes 
        url = await generateMultipleOrderItemsUrl(darazid.emailid,darazid.secretkey,"["+order.OrderId+"]");
        orderitemsdata = await GetData(url);
        try{
        for(const order of orderitemsdata.Orders[0].OrderItems)
        {
            


            var findorder = await Order.findOne({OrderItemId:order.OrderItemId});
            //updating statuses
            if(findorder.Status!=order.Status){
                console.log(findorder.Status+" "+order.Status);
                findorder.Status=order.Status;
                const result = await findorder.save();
            }
            //Update Tracking if tracking available
            if(findorder.TrackingCode==""){
                if(order.TrackingCode!="")
                {
                    findorder.TrackingCode=order.TrackingCode;
                    const result = await findorder.save();
                    // console.log(result);
                }
                
            }
             //New Updated Tracking if changed
            else if(findorder.TrackingCode!=order.TrackingCode)
            {
               
                findorder.UpdatedTracking=order.TrackingCode;
                const result = await findorder.save();
                // console.log(result);
            }
        }
    }
    catch(error){
        // console.log(error);
    }
        
        

       


    }
    console.log("Status Loop done");

    try {
        setTimeout(()=>{
            updateStatus();
        },10000);
    } catch (error) {
        console.log(error);
    }
    
    
}


async function getOrderData(userid,secretkey,data){
    //MultipleOrderIds Passed and OrderItemData Gathered

    //Extracting orderids only from all orders
    var orderids='['
    data.forEach(element => {
        orderids+=element.OrderId+',';
        
    });
    orderids+=']'
    // console.log(orderids);

    //creating url to get MultipleOrderItems
    url = await generateMultipleOrderItemsUrl(userid,secretkey,orderids);
    // console.log(url);

    //Passing url to get Data using axios
    orderitemsdata = await GetData(url);
    return orderitemsdata;
    // console.log(orderitemsdata.Orders)
   
    
}





module.exports.UpdateData = UpdateData
module.exports.updateStatus = updateStatus
module.exports.updatePending = updatePending