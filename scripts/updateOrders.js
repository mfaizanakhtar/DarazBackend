const {GetData} = require('./HttpReq');
const {OrderItems} = require('../models/orderItem');
const { Darazid } = require('../models/darazid');
const {Order} = require('../models/order');
const {Sku} = require('../models/sku');
const {darazSku}=require('../models/darazsku')
const {generateMultipleOrderItemsUrl,getOrderIdArray,generateOrdersUrl,generateLabelUrl, generateSingleOrderUrl} = require('./GenerateUrl');
const cheerio = require('cheerio')
const {getSkus} = require('./updateSku')
const atob = require("atob");
const {updateOrderItemStatus} = require('../scripts/updateStatus');
const { previousDataQuery } = require('../models/previousDataQuery');
const e = require('express');


async function getOrderItemsData(userid,secretkey,data){
    //MultipleOrderIds Passed and OrderItemData Gathered
    //Extracting orderids only from all orders
    var orderids = getOrderIdArray(data)

    //creating url to get MultipleOrderItems
    url = await generateMultipleOrderItemsUrl(userid,secretkey,orderids);
    //Passing url to get Data using axios
    orderitemsdata = await GetData(url);
    return orderitemsdata;
   
    
}

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

async function updateNewOrders(id,OrdersData){
    for (const order of OrdersData){
    var result = await Order.findOne({OrderId:order.OrderId,ShopId:id.shopid})
    // console.log(result)

    if(!result){
        var orderobj = setOrderObj(order,id)
        var res = await orderobj.save()
        // console.log(res);
    }
}


}

async function updateNewOrderItems(shopid,secretkey,useremail,Orders){

    var toUpdateDarazSkus=[]
    var toFetchDarazSkus=[]
    //fetch orderItems data from daraz api
    try{
            OrderItemsData = await getOrderItemsData(shopid,secretkey,Orders)
        //iterate orderitems fetched data
        for(const items of OrderItemsData.Orders){
            for(var item of items.OrderItems){
                // console.log(item)
            var result = await OrderItems.findOne({OrderItemId: item.OrderItemId,ShopId:shopid})
            // if orderitem does not exist, add to db
            
            if(!result){
                var dSku = await darazSku.findOne({ShopSku:item.ShopSku,useremail:useremail})
                if(dSku==null){
                    if(!toFetchDarazSkus.includes('"'+item.Sku+'"')) toFetchDarazSkus.push('"'+item.Sku+'"')
                    dSku={FBMpackagingCost:0,FBDpackagingCost:0,cost:0}
                }
                else if(dSku!=null){
                    if(!toUpdateDarazSkus.includes('"'+item.Sku+'"')) toUpdateDarazSkus.push('"'+item.Sku+'"')
                }
                var orderItem = setOrderItemObj(item,shopid,useremail,dSku)

                var result = await orderItem.save();
                //pushing orderItemId._id in Order Record for reference
                await Order.updateMany({
                    OrderId:result.OrderId,ShopId:shopid
                },
                {$push:{OrderItems:result._id,Skus:result.Sku,BaseSkus:result.BaseSku}})

            }
        }
        };

        if(toUpdateDarazSkus.length>0){
            await getSkus(shopid,toUpdateDarazSkus,"UpdateExisting")
        }if(toFetchDarazSkus.length>0){
            await getSkus(shopid,toFetchDarazSkus,"FetchNew")
        }
    }catch(ex){
        console.log("Error in updateNewOrderItems");
    }
    
    

}

function setOrderItemObj(item,shopid,useremail,sku){
    // console.log(item)
    var packagingCost
    if(item.ShippingType=="Dropshipping"){
        packagingCost={packagingCost:sku.FBMpackagingCost}
    }
    else if(item.ShippingType=="Own Warehouse"){
        packagingCost={packagingCost:sku.FBDpackagingCost}
    }
    var orderItem = new OrderItems({
        OrderId:item.OrderId,
        OrderItemId:item.OrderItemId,
        ShopId:shopid,
        Name:item.Name,
        Sku:item.Sku,
        BaseSku:baseSku(item.Sku),
        ShopSku:item.ShopSku,
        ShippingType:item.ShippingType,
        ItemPrice:item.ItemPrice,
        ShippingAmount:item.ShippingAmount,
        Status:item.Status,
        TrackingCode:item.TrackingCode,
        ShippingProviderType:item.ShippingProviderType,
        ShipmentProvider:item.ShipmentProvider.substr(item.ShipmentProvider.indexOf(',')+2),
        CreatedAt:item.CreatedAt,
        UpdatedAt:item.UpdatedAt,
        productMainImage:item.productMainImage,
        Variation:item.Variation,
        useremail:useremail,
        cost:sku.cost,
        Reason:item.Reason,
        ...packagingCost
    })
    // console.log(orderItem.ShipmentProvider)
    return orderItem;
}

function setOrderObj(order,id){
    
    var orderobj = new Order({
        OrderId:order.OrderId,
        CustomerFirstName:order.CustomerFirstName,
        CustomerLastName:order.CustomerLastName,
        PaymentMethod:order.PaymentMethod,
        Price:parseInt(order.Price),
        CreatedAt:order.CreatedAt,
        UpdatedAt:order.UpdatedAt,
        AddressBilling:{
            FirstName:order.AddressBilling.FirstName,
            LastName:order.AddressBilling.LastName,
            Phone:order.AddressBilling.Phone,
            Address1:order.AddressBilling.Address1,
            Address2:order.AddressBilling.Address2,
            Address3:order.AddressBilling.Address3,
            Address4:order.AddressBilling.Address4,
            Address5:order.AddressBilling.Address5,
            CustomerEmail:order.AddressBilling.CustomerEmail,
            City:order.AddressBilling.City,
            PostCode:order.AddressBilling.PostCode,
            Country:order.AddressBilling.Country,
    
        },
        AddressShipping:{
            FirstName:order.AddressShipping.FirstName,
            LastName:order.AddressShipping.LastName,
            Phone:order.AddressShipping.Phone,
            Address1:order.AddressShipping.Address1,
            Address2:order.AddressShipping.Address2,
            Address3:order.AddressShipping.Address3,
            Address4:order.AddressShipping.Address4,
            Address5:order.AddressShipping.Address5,
            CustomerEmail:order.AddressShipping.CustomerEmail,
            City:order.AddressShipping.City,
            PostCode:order.AddressShipping.PostCode,
            Country:order.AddressShipping.Country,
            
        },
        ItemsCount:order.ItemsCount,
        Statuses:order.Statuses,
        Voucher:order.Voucher,
        VoucherPlatform:order.VoucherPlatform,
        VoucherSeller:order.VoucherPlatform,
        ShippingFee:parseInt(order.ShippingFee),
        ShopId:id.shopid,
        ShopName:id.shopName,
        ShopAddress:id.shopAddress,
        ShopState:id.shopState,
        ShopArea:id.shopArea,
        ShopLocation:id.shopLocation,
        ShopPhone:id.shopPhone,
        useremail:id.useremail
    })
    // console.log(orderobj)
    return orderobj
}

async function updateOrdersData(){

    try{
    var userids = await Darazid.find()
    //iterating through all fetched ips
    for(const id of userids){
        // console.log(id);
    let url = generateOrdersUrl(id.shopid,id.secretkey,0);
    // console.log(url)
    var data = await GetData(url);
    var previousUpdateData = await previousDataQuery.find({ShopId:id.shopid,queryData:{$all:data.Orders},queryType:"ordersData"})
    if(previousUpdateData.length<=0){
        await updateNewOrders(id,data.Orders)
        await updateNewOrderItems(id.shopid,id.secretkey,id.useremail,data.Orders)
        previousUpdateData = await previousDataQuery.find({ShopId:id.shopid,queryType:"ordersData"})

        if(previousUpdateData.length>0){
            await previousDataQuery.updateMany({ShopId:id.shopid,queryType:"ordersData"},{queryData:data.Orders})
        }else await new previousDataQuery({ShopId:id.shopid,queryData:data.Orders,queryType:"ordersData"}).save()
        console.log("New Data Found");
    }
    else{
        // console.log("data is same as previousOrder");
    }
}
    }
    catch(ex){
        console.log("Exception occured, error: "+ex.message);
    }
    
    console.log("Data Loop done");
}

async function updateSingleOrder(shopid,orderid){

    try{
    var id = await Darazid.findOne({shopid:shopid})
    

        // console.log(id);
    let url = generateSingleOrderUrl(id.shopid,id.secretkey,orderid);
    // console.log(url)
    var data = await GetData(url);
    // console.log(data)
    await updateNewOrders(id,data.Orders)
    await updateNewOrderItems(id.shopid,id.secretkey,id.useremail,data.Orders)
    // console.log(data);

    }
    catch(ex){
        console.log(ex.message);
    }
}

module.exports.updateOrdersData = updateOrdersData
module.exports.updateSingleOrder = updateSingleOrder