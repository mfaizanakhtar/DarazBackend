const {GetData} = require('./HttpReq');
const {OrderItems} = require('../models/orderItem');
const { Darazid } = require('../models/darazid');
const {Order} = require('../models/order');
const {Sku} = require('../models/sku');
const {generateMultipleOrderItemsUrl,getOrderIdArray,generateOrdersUrl,generateLabelUrl} = require('./GenerateUrl');
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
    return orderitemsdata;
    // console.log(orderitemsdata.Orders)
   
    
}

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

async function updateOrders(shopid,useremail,OrdersData){
    for (const order of OrdersData){
    var result = await Order.findOne({OrderId:order.OrderId})
    // console.log(result)

    if(!result){
        var orderobj = OrderObj(order,shopid,useremail)
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
        var result = await OrderItems.findOne({OrderItemId: item.OrderItemId})
        // if orderitem does not exist, add to db
        
        if(!result){
        var orderItem
        var skuresult = await Sku.findOne({name:baseSku(item.Sku)})
            if(skuresult==null){
                //creating new sku
                var sku = new Sku({
                    name:baseSku(item.Sku)
                })
                await sku.save();
                orderItem = OrderItemObj(item,shopid,useremail,0);
            }
            if(skuresult!=null){
                //reducing stock
                await Sku.update({name:baseSku(item.Sku)},{
                    $inc:{stock:-1}
                })
                orderItem = OrderItemObj(item,shopid,useremail,skuresult.cost)
            }

            // creating orderitem object
            
            var result = await orderItem.save();
            //pushing orderItemId._id in Order Record for reference
            await Order.update({
                OrderId:result.OrderId
            },
            {$push:{OrderItems:result._id,Skus:result.Sku,BaseSkus:result.BaseSku}})

            // console.log(result);
        }
    }
    };

}

function OrderItemObj(item,shopid,useremail,cost){
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
        CreatedAt:item.CreatedAt,
        UpdatedAt:item.UpdatedAt,
        productMainImage:item.productMainImage,
        Variation:item.Variation,
        useremail:useremail,
        cost:cost
    })
    // console.log(orderItem)
    return orderItem;
}

function OrderObj(order,shopid,useremail){
    
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
        ShopId:shopid,
        useremail:useremail
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
    await updateOrders(id.shopid,id.useremail,data.Orders)
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

module.exports.updateOrdersData = updateOrdersData