const {GetData} = require('./HttpReq');
const {OrderItems} = require('../models/orderItem');
const { Darazid } = require('../models/darazid');
const {Order} = require('../models/order');
const {Sku} = require('../models/sku');
const {generateMultipleOrderItemsUrl,getOrderIdArray,generateOrdersUrl,generateLabelUrl, generateSingleOrderUrl} = require('./GenerateUrl');
const cheerio = require('cheerio')
const atob = require("atob");


async function getOrderItemsData(userid,secretkey,data){
    //MultipleOrderIds Passed and OrderItemData Gathered
    // console.log(data)
    //Extracting orderids only from all orders
    var orderids = getOrderIdArray(data)
    // console.log(orderids);

    //creating url to get MultipleOrderItems
    url = await generateMultipleOrderItemsUrl(userid,secretkey,orderids);
    // console.log(url);
    //Passing url to get Data using axios
    orderitemsdata = await GetData(url);
    // console.log(orderitemsdata.Orders)
    return orderitemsdata;
   
    
}

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

async function updateOrders(id,OrdersData){
    for (const order of OrdersData){
    var result = await Order.findOne({OrderId:order.OrderId,ShopId:id.shopid})
    // console.log(result)

    if(!result){
        var orderobj = OrderObj(order,id)
        var res = await orderobj.save()
        // console.log(res);
    }
}


}

async function updateOrderItems(shopid,secretkey,useremail,Orders){
    // console.log(Orders)
    //fetch orderItems data from daraz api
    OrderItemsData = await getOrderItemsData(shopid,secretkey,Orders)
    //iterate orderitems fetched data
    for(const items of OrderItemsData.Orders){
        for(var item of items.OrderItems){
            // console.log(item)
        var result = await OrderItems.findOne({OrderItemId: item.OrderItemId,ShopId:shopid})
        // if orderitem does not exist, add to db
        
        if(!result){
        var orderItem

        if(item.ShippingType=="Dropshipping"){
            var stockType={FBMstock:-1}
        }
        else if(item.ShippingType=="Own Warehouse"){
            var stockType={FBMstock:0}
        }
        // console.log(stockType)

        var skuresult = await Sku.findOne({name:baseSku(item.Sku),useremail:useremail})
            if(skuresult==null){
                //creating new sku
                var sku = new Sku({
                    name:baseSku(item.Sku),
                    useremail:useremail,
                    ...stockType
                })
                await sku.save();
                orderItem = OrderItemObj(item,shopid,useremail,{cost:0,FBMpackagingCost:0,FBDpackagingCost:0});
            }
            if(skuresult!=null){
                //reducing stock
                await Sku.updateMany({name:baseSku(item.Sku),useremail:useremail},{
                    $inc:stockType
                })
                orderItem = OrderItemObj(item,shopid,useremail,skuresult)
            }

            // creating orderitem object
            
            var result = await orderItem.save();
            // console.log(result)
            //pushing orderItemId._id in Order Record for reference
            await Order.updateMany({
                OrderId:result.OrderId,ShopId:shopid
            },
            {$push:{OrderItems:result._id,Skus:result.Sku,BaseSkus:result.BaseSku}})

            // console.log(result);
        }
    }
    };

}

function OrderItemObj(item,shopid,useremail,sku){
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
        ...packagingCost
    })
    // console.log(orderItem.ShipmentProvider)
    return orderItem;
}

function OrderObj(order,id){
    
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
    await updateOrders(id,data.Orders)
    await updateOrderItems(id.shopid,id.secretkey,id.useremail,data.Orders)
    // console.log(data);
}
    }
    catch(ex){
        console.log(ex.message);
    }
    
    console.log("Data Loop done");
    try {
        setTimeout(()=>{
            updateOrdersData();
        },300000);
    } catch (error) {
        console.log(error);
    }
}

async function updateSingleOrder(shopid,orderid){

    try{
    var id = await Darazid.findOne({shopid:shopid})
    

        // console.log(id);
    let url = generateSingleOrderUrl(id.shopid,id.secretkey,orderid);
    // console.log(url)
    var data = await GetData(url);
    // console.log(data)
    await updateOrders(id,data.Orders)
    await updateOrderItems(id.shopid,id.secretkey,id.useremail,data.Orders)
    // console.log(data);

    }
    catch(ex){
        console.log(ex.message);
    }
}

module.exports.updateOrdersData = updateOrdersData
module.exports.updateSingleOrder = updateSingleOrder