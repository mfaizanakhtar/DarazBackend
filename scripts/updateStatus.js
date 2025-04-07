const {OrderItems} = require('../models/orderItem');
const {Shop} = require('../models/shop');
const {generateMultipleOrderItemsUrl,generateLabelUrl} = require('../service/GenerateUrl');
const {GetData} = require('./HttpReq');
const {getOrderIdArray} = require('../service/GenerateUrl')
const cheerio = require('cheerio')
const atob = require("atob");

async function updateOrderItemsForRts(user,RtsOrdersResponse){

    if(RtsOrdersResponse>0){

        var updateResult = await updateOrderItemStatus({userEmail:user},{Status:'packed',ShippingType:'Dropshipping'})
        return updateResult
    }
 
}

async function updateOrderItemAfterPacking(user,PackOrderList){

    if(PackOrderList?.length>0){

        var updateResult = await updateOrderItemStatus({userEmail:user},{Status:'pending',ShippingType:'Dropshipping'})
        return updateResult
    }

}

async function setPackageIdAfterPack(user,ShopShortCode,PackOrderList){

    console.log("status ",user)
    let updateResult = {}
    if(PackOrderList?.length>0){
        for(packOrder of PackOrderList){
            for(orderItem of packOrder?.order_item_list){
                updateResult = await OrderItems.findOneAndUpdate(
                    {
                        userEmail:user,
                        ShopShortCode:ShopShortCode,
                        OrderItemId:orderItem.order_item_id
                    },
                    {
                        packageId:orderItem.package_id
                    })
            }
        }
        console.log(updateResult)
        return updateResult
    }

}

async function updateOrderItemStatus(user,status){
    try{

        let darazid = await Shop.find({...user});
    for(let shop of darazid){
        //get order with statuses of this shop
        splitCount=100
        let orderitemscount = await OrderItems.countDocuments({...status,ShopShortCode:shop.shortCode})
        // console.log(orderitemscount)
        let end = Math.ceil(orderitemscount/splitCount)
        // console.log(end)
        for(let i=0;i<end;i++){
            let orderitems = await OrderItems.find({...status,ShopShortCode:shop.shortCode})
            .skip(i*splitCount)
            .limit(splitCount)
            // console.log(shop.shopid+' '+orderitems.length)
            let orderitemsrray = orderitems.map((order)=>'"'+order.OrderId+'"')
            let url = await generateMultipleOrderItemsUrl(shop.accessToken,'['+orderitemsrray+']');
            // console.log(url)
            let orderitemsdata = await GetData(url);
            if(orderitemsdata && orderitemsdata.length>0){
                // console.log(orderitemsdata.Orders.length)

                for(let orders of orderitemsdata){
                    if(orders.order_items && orders.order_items.length>0){
                        for(item of orders.order_items){

                            updateResult = await OrderItems.findOneAndUpdate(
                            {OrderId:item.order_id,Sku:item.sku,ShopSku:item.shop_sku,
                            ShippingType:item.shipping_type,OrderItemId:item.order_item_id,ItemPrice:item.item_price,
                            ShippingAmount:item.shipping_amount
                            ,Variation:item.variation},
                            {Status:item.status,TrackingCode:item.tracking_code,packageId:item.package_id,
                                ShipmentProvider:item.shipment_provider.substr(item.shipment_provider.indexOf(',')+2),UpdatedAt:item.updated_at,Reason:item.reason})
                        
                        }
                    }
                }
            }else{
                console.log("Invalid username or secretkey of shop "+ shop.name)
            }
        }

    }
    }catch(error){
        console.log(error)
    }
    return true

}

async function fetchLabelsAndUpdate(userEmail){
    console.log("labels ",userEmail)
    shops = await Shop.find({userEmail:userEmail,appStatus:true})
    for(shop of shops){
        var orderitemsIds=[]
        items= await OrderItems.find({ShopShortCode:shop.shortCode,Status:'ready_to_ship',labelTracking:'',ShippingType:'Dropshipping'})
        // console.log(items)
        for(item of items){
            orderitemsIds.push(item.OrderItemId)
        }
        await updateOrderItemPortCodes(shop.accessToken,orderitemsIds)
    }
}

async function updateOrderItemPortCodes(accessToken,orderItemIds){
    console.log(orderItemIds,orderItemIds.length)
    console.log("Entry Checkpoint")

    splitCount=35
    lastCount=0
    
    for(let j=0;j<Math.ceil(orderItemIds.length/splitCount);j++){
        var portCodes=[]
        var PortCodeImages=[]
        var trackings=[]
        var trackingbarcodes=[]
        var qrcodes=[]
        var deliveryPoints=[]
        var labelPrices=[]
        var labelOrderNumbers=[]
        var sellerAddress=[]
        console.log("First Loop")

    try{
    url = generateLabelUrl(accessToken,"["+orderItemIds.toString()+"]",'shippingLabel')
    var data = await GetData(url)
    console.log("1st Checkpoint")
    var result = atob(data.document.file)
    const $=cheerio.load(result)
        //scrape portcodes
    $("div").find('div:nth-child(1)').find('div:nth-child(5)').each(function(index,element){
        PortCode=$(element).text()
        PortCode=PortCode.trim()
        portCodes.push(PortCode)
    });
            //scrape portcodes Images
    $("div").find('div:nth-child(1)').find('div:nth-child(3)').find('img').each(function(index,element){
        let portCodeImage=$(element).attr('src')
        PortCodeImages.push(portCodeImage)
    });
    //scrape Tracking to search
    $("div[class='cn-print-imgbarcode'][data-typecode='code128']").each(function(index,element){
        let trackingBarcode = $(element).find('img').attr('src')
        trackingbarcodes.push(trackingBarcode)

        Tracking=$(element).attr('data-value')
        Tracking = Tracking.trim()
        trackings.push(Tracking)
    });
    //scrape Label Price
    $("div").find('div:nth-child(1)').find('div:nth-child(16)').each(function(index,element){
        labelPrices.push($(element).text())
    });
    //scrape deliveryPoint
    $("div").find('div:nth-child(1)').find('div:nth-child(15)').find('table').find('tbody').find('tr:nth-child(3)')
    .each(function(index,element){
        deliveryPoints.push($(element).text().trim())
    });
    //scrape ordernumber from label
    $("div").find('div:nth-child(1)').find('div:nth-child(22)').each(function(index,element){
        labelOrderNumbers.push($(element).text().substr(13).trim())
    });

    $("div[class='cn-print-imgbarcode'][data-typecode='qrcode']").find('img').each(function(index,element){
        let qrCode = $(element).attr('src')
        qrcodes.push(qrCode)
    });
    //scrape seller address
    $("div").find('div:nth-child(1)').find('div:nth-child(12)').each(function(index,element){
        sellerAddress.push($(element).text())
    });
    console.log("2nd Checkpoint")
    console.log(trackings.length)


    for(let i=0;i<trackings.length;i++){
        console.log("3rd Checkpoint")
    if(trackings[i] && labelOrderNumbers[i]){
        updateResult = await OrderItems.updateMany({TrackingCode:trackings[i].toString(),OrderId:labelOrderNumbers[i].toString()},{
            $set:{
                PortCode:portCodes[i],trackingBarcode:trackingbarcodes[i],
                PortCodeImage:PortCodeImages[i],
                qrCode:qrcodes[i],labelPrice:labelPrices[i],
                deliveryPoint:deliveryPoints[i],labelTracking:trackings[i],
                sellerAddress:sellerAddress[i]
            }
        })
        console.log(updateResult)
    }      
    }
}catch(error){
    console.log(error)
}
}
    
    
}

module.exports.updateOrderItemStatus = updateOrderItemStatus
module.exports.updateOrderItemsForRts = updateOrderItemsForRts
module.exports.fetchLabelsAndUpdate = fetchLabelsAndUpdate
module.exports.updateOrderItemAfterPacking = updateOrderItemAfterPacking
module.exports.setPackageIdAfterPack = setPackageIdAfterPack