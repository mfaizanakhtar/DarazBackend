const {GetData} = require('./HttpReq');
const {OrderItems} = require('../models/orderItem');
const { Shop } = require('../models/shop');
const {Order} = require('../models/order');
const {darazSku}=require('../models/darazsku')
const {generateMultipleOrderItemsUrl,getOrderIdArray,generateOrdersUrl,generateLabelUrl, generateSingleOrderUrl} = require('../service/GenerateUrl');
const {getSkus} = require('./updateSku')
const { previousDataQuery } = require('../models/previousDataQuery');
const moment = require('moment');


async function getOrderItemsData(accessToken,data){
    //MultipleOrderIds Passed and OrderItemData Gathered
    //Extracting orderids only from all orders
    var orderids = data.map(order=>'"'+order.order_id+'"')

    //creating url to get MultipleOrderItems
    url = await generateMultipleOrderItemsUrl(accessToken,'['+orderids+']');
    //Passing url to get Data using axios
    orderitemsdata = await GetData(url);
    return orderitemsdata;
   
    
}

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

async function updateNewOrders(shop,OrdersData){
    for (const order of OrdersData){
    var result = await Order.findOne({OrderId:order.order_id,ShopShortCode:shop.shortCode})
    // console.log(result)

    if(!result){
        var orderobj = setOrderObj(order,shop)
        var res = await orderobj.save()
        // console.log(res);
    }
}


}

async function updateNewOrderItems(shop,orders){

    var toFetchUpdateDarazSkus=[]
    //fetch orderItems data from daraz api
    try{
            OrderItemsData = await getOrderItemsData(shop.accessToken,orders)
        //iterate orderitems fetched data
        for(const items of OrderItemsData){
            for(var item of items.order_items){
                // console.log(item)
            var result = await OrderItems.findOne({OrderItemId:item.order_item_id,ShopShortCode:shop.shortCode})
            // if orderitem does not exist, add to db
            
            if(!result){
                var dSku = await darazSku.findOne({ShopSku:item.shop_sku,userEmail:shop.userEmail})
				if(dSku==null){
                    dSku={FBMpackagingCost:0,FBDpackagingCost:0,cost:0}
                }
                if(!toFetchUpdateDarazSkus.includes(item.sku)) toFetchUpdateDarazSkus.push(item.sku)

                var orderItem = setOrderItemObj(item,shop.shortCode,shop.userEmail,dSku,shop.name)

                var result = await orderItem.save();
                //pushing orderItemId._id in Order Record for reference
                await Order.updateMany({
                    OrderId:result.OrderId,ShopShortCode:shop.shortCode
                },
                {$push:{OrderItems:result._id,Skus:result.Sku,BaseSkus:result.BaseSku}})

            }
        }
        };

        if(toFetchUpdateDarazSkus.length>0){
            await getSkus(shop,toFetchUpdateDarazSkus)
        }
    }catch(ex){
        console.log("Error in updateNewOrderItems: "+ex);
    }

}

function setOrderItemObj(item,shortCode,userEmail,sku,shopName){
    // console.log(item)
    var packagingCost
    if(item.shipping_type=="Dropshipping"){
        packagingCost={packagingCost:sku.FBMpackagingCost}
    }
    else if(item.shipping_type=="Own Warehouse"){
        packagingCost={packagingCost:sku.FBDpackagingCost}
    }
    var orderItem = new OrderItems({
        OrderId:item.order_id,
        OrderItemId:item.order_item_id,
        ShopShortCode:shortCode,
        ShopName:shopName,
        Name:item.name,
        Sku:item.sku,
        BaseSku:baseSku(item.sku),
        ShopSku:item.shop_sku,
        ShippingType:item.shipping_type,
        ItemPrice:item.item_price,
        ShippingAmount:item.shipping_amount,
        Status:item.status,
        TrackingCode:item.tracking_code,
        ShippingProviderType:item.shipping_provider_type,
        ShipmentProvider:item.shipment_provider.substr(item.shipment_provider.indexOf(',')+2),
        // CreatedAt:moment(new Date(item.created_at)).add('5','hours').toDate(),
        // UpdatedAt:moment(new Date(item.updated_at)).add('5','hours').toDate(),
        CreatedAt:item.created_at,
        UpdatedAt:item.updated_at,
        SlaTimeStamp:item.sla_time_stamp,
        Currency:item.currency,
        productDetailUrl:item.product_detail_url,
        productMainImage:item.product_main_image,
        Variation:item.variation,
        userEmail:userEmail,
        cost:sku.cost,
        Reason:item.reason,
        ...packagingCost
    })
    // console.log(orderItem.ShipmentProvider)
    return orderItem;
}

function setOrderObj(order,shop){
    
    var orderobj = new Order({
        OrderId:order.order_id,
        CustomerFirstName:order.customer_first_name,
        CustomerLastName:order.customer_last_name,
        PaymentMethod:order.payment_method,
        Price:parseInt(order.price),
        CreatedAt:order.created_at,
        UpdatedAt:order.created_at,
        AddressBilling:{
            FirstName:order.address_billing.first_name,
            LastName:order.address_billing.last_name,
            Phone:order.address_billing.phone,
            Address1:order.address_billing.address1,
            Address2:order.address_billing.address2,
            Address3:order.address_billing.address3,
            Address4:order.address_billing.address4,
            Address5:order.address_billing.address5,
            City:order.address_billing.city,
            PostCode:order.address_billing.post_code,
            Country:order.address_billing.country,
    
        },
        AddressShipping:{
            FirstName:order.address_shipping.first_name,
            LastName:order.address_shipping.last_name,
            Phone:order.address_shipping.phone,
            Address1:order.address_shipping.address1,
            Address2:order.address_shipping.address2,
            Address3:order.address_shipping.address3,
            Address4:order.address_shipping.address4,
            Address5:order.address_shipping.address5,
            City:order.address_shipping.city,
            PostCode:order.address_shipping.post_code,
            Country:order.address_shipping.country,
            
        },
        ItemsCount:order.items_count,
        Statuses:order.statuses,
        Voucher:order.voucher,
        VoucherPlatform:order.voucher_platform,
        VoucherSeller:order.voucher_seller,
        ShippingFee:order.shipping_fee,
        ShippingFeeOriginal:order.shipping_fee_original,
        ShippingFeeDiscountSeller:order.shipping_fee_discount_seller,
        ShippingFeeDiscountPlatform:order.shipping_fee_discount_platform,
        ShopShortCode:shop.shortCode,
        ShopName:shop.name,
        ShopEmail:shop.email,
        ShopLocation:shop.location,
        UserEmail:shop.userEmail
    })
    // console.log(orderobj)
    return orderobj
}

async function updateOrdersData(){

    try{
    var shops = await Shop.find({appStatus:true})
    //iterating through all fetched ips
        for(const shop of shops){
            // console.log(id);
            let url = generateOrdersUrl(shop.accessToken,0);
            // console.log(url)
            var data = await GetData(url);
            if(data!=null){
                var previousUpdateData = await previousDataQuery.find({shopShortCode:shop.shortCode,queryData:{$all:data.orders},queryType:"ordersData"})
                if(previousUpdateData.length<=0){
                    await updateNewOrders(shop,data.orders)
                    await updateNewOrderItems(shop,data.orders)
                    previousUpdateData = await previousDataQuery.find({shopShortCode:shop.shortCode,queryType:"ordersData"})
    
                    if(previousUpdateData.length>0){
                        await previousDataQuery.updateMany({shopShortCode:shop.shortCode,queryType:"ordersData"},{queryData:data.orders})
                    }else await new previousDataQuery({shopShortCode:shop.shortCode,queryData:data.orders,queryType:"ordersData"}).save()
                    console.log("New Data Found");
                }
                else{
                    // console.log("data is same as previousOrder");
                }
            }else{
                console.log("Invalid user or secretkey of shop " + shop.name)
            }
            
        }
    }
    catch(ex){
        console.log("Exception occured, error: "+ex.message);
    }
    
    console.log("Data Loop done");
}


module.exports.updateOrdersData = updateOrdersData