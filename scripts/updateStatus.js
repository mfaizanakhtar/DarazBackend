const {OrderItems} = require('../models/orderItem');
const {Darazid} = require('../models/darazid');
const {generateMultipleOrderItemsUrl,generateLabelUrl} = require('../scripts/GenerateUrl');
const {GetData} = require('./HttpReq');
const {Order} = require('../models/order')
const {getOrderIdArray} = require('../scripts/GenerateUrl')
const cheerio = require('cheerio')
const atob = require("atob");

async function updateOrderItemStatus(){
    var result=null
    var darazid = await Darazid.find();
    //get All Shops in db
    
    darazid.forEach(async(shop) => {
        var rtsOrderItemIds=[]
        //get order with statuses of this shop
        splitCount=300
        var orderitemscount = await OrderItems.countDocuments({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        // console.log(orderitemscount)
        end = Math.ceil(orderitemscount/splitCount)
    for(let i=0;i<end;i++){
        var orderitems = await OrderItems.find({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        .skip(i*splitCount)
        .limit(splitCount)
        // console.log(getOrderIdArray(orderitems))
        url = await generateMultipleOrderItemsUrl(shop.shopid,shop.secretkey,getOrderIdArray(orderitems));
        orderitemsdata = await GetData(url);
        // console.log(orderitemsdata.Orders)

        orderitemsdata = orderitemsdata.Orders
        // console.log(orderitemsdata)
        //iterate all orders fetched from api
        try{
        orderitemsdata.forEach(async(orders)=>{
            orders.OrderItems.forEach(async(item) => {
                // console.log(item)
            
            
            //find fetched order
            var finditem = await OrderItems.findOne({OrderItemId:item.OrderItemId});
            // if(finditem.Status=='pending') console.log(finditem.OrderId+' '+item.Status)
            //updating statuses
            if(finditem.Status!=item.Status){
                // console.log(findorder.Status+" "+order.Status);
                finditem.Status=item.Status;
                //for PortCode OrderItemIds

            
            //Update Tracking if tracking available
            // console.log('existing tracking',finditem.TrackingCode,'daraz tracking',item.TrackingCode)
            if(finditem.TrackingCode==""){
                if(item.TrackingCode!="")
                {
                    //saving rtsOrderItemIds for portcodes later
                    if(finditem.ShippingType=="Dropshipping") rtsOrderItemIds.push(finditem.OrderItemId)
                    //updating tracking
                    finditem.TrackingCode=item.TrackingCode;
                    // const result = await finditem.save();
                    // console.log(result);
                }
                
            }
             //New Updated Tracking if changed
            else if(finditem.TrackingCode!=item.TrackingCode)
            {
               
                finditem.UpdatedTracking=item.TrackingCode;
                // console.log(result);
            }
            result = await finditem.save();
            // console.log(rtsOrderItemIds.length)
            // if (rtsOrderItemIds.length>0) await updateOrderItemPortCodes(shop.shopid,shop.secretkey,rtsOrderItemIds)
        }
        });
        })
        console.log(rtsOrderItemIds.length)
        if (rtsOrderItemIds.length>0) await updateOrderItemPortCodes(shop.shopid,shop.secretkey,rtsOrderItemIds)
    }
    catch(error){
        console.log(error);
    }
    }
    
    }
    );
    

    console.log("Status Loop done");

    try {
        setTimeout(()=>{
            updateOrderItemStatus();
        },180000);
    } catch (error) {
        console.log(error);
    }
    
}

async function updateOrderItemPortCodes(shopid,secretkey,orderItemIds){
    console.log("Entry Checkpoint")
    var portCodes=[]
    var trackings=[]
    trackingbarcodes=[]
    portcodebarcodes=[]
    // orderidbarcodes=[]
    qrcodes=[]
    deliveryPoints=[]
    labelPrices=[]

    splitCount=20
    lastCount=1

    for(let j=0;j<Math.ceil(orderItemIds.length/splitCount);j++){
        console.log("First Loop")
    
    OrderItemStringArray='['+orderItemIds[0]

    if(orderItemIds.length<splitCount) splitCount=orderItemIds.length
    for(let i=lastCount;i<splitCount;i++){
        console.log("Second Loop")
        OrderItemStringArray=OrderItemStringArray+','+orderItemIds[i]
    }
    splitCount=splitCount+lastCount
    OrderItemStringArray=OrderItemStringArray+']'
    console.log(OrderItemStringArray)   
    // data = await (generateLabelUrl(shopid,secretkey,OrderItemStringArray))
    try{
    url = generateLabelUrl(shopid,secretkey,OrderItemStringArray)
    var data = await GetData(url)
    console.log("1st Checkpoint")
    var result = atob(data.Document.File)
    const $=cheerio.load(result)
        //scrape portcodes
    $("div").find('div:nth-child(5)').each(function(index,element){
        PortCode=$(element).text().substr(14)
        PortCode=PortCode.substr(0,PortCode.length-1)
        portCodes.push(PortCode)
    });
    //scrape Tracking to search
    $("div").find('div:nth-child(4)').each(function(index,element){

        Tracking=$(element).text().substr(20)
        Tracking = Tracking.substr(0,Tracking.length-1)
        trackings.push(Tracking)
    });
    //scrape Label Price
    $("div").find('div:nth-child(11)').each(function(index,element){
        labelPrices.push($(element).text())
    });
    //scrape deliveryPoint
    $("div").find('div:nth-child(8)').each(function(index,element){

        deliveryPoints.push($(element).text())

    });
    //scrape trackingbarcodes images
    $('div[class=barcode]').find('img').each(function(index,element){

        if((index % 3==0)){
            trackingbarcodes.push($(element).attr('src'))
        }

    });
    // $('div[class=barcode]').find('img').each(function(index,element){

    //     if((index % 3==0)){
    //         trackingbarcodes.push($(element).attr('src'))
    //     }
    //     if(((index-2) % 3==0)){
    //         orderidbarcodes.push($(element).attr('src'))
    //     }

    // });
    // $('div[class=barcode]').find('img').each(function(index,element){
        
    //     if((index == i)){
    //         trackingbarcodes.push($(element).attr('src'))
    //         console.log($(element).attr('src'))
    //     }
    //     else if((index == i+1)){
    //         portcodebarcodes.push($(element).attr('src'))
    //         console.log($(element).attr('src'))
    //     }
    //     else if((index == i+2)){
    //         orderidbarcodes.push($(element).attr('src'))
    //     }
    //     i=i+3


    // });
    //scrape qrcodes images
    $('div[class="box left qrcode"]').find('img').each(function(index,element){

            qrcodes.push($(element).attr('src'))

    });
    console.log("2nd Checkpoint")
    for(let i=0;i<trackings.length;i++){
        console.log("3rd Checkpoint")
        // updateResult = await OrderItems.updateMany({TrackingCode:trackings[i]},{
        //     $set:{PortCode:portCodes[i],trackingBarcode:trackingbarcodes[i],qrCode:qrcodes[i],
        //         portcodeBarcode:portcodebarcodes[i],orderIdBarcode:orderidbarcodes[i]}
        // })
        updateResult = await OrderItems.updateMany({TrackingCode:trackings[i]},{
            $set:{PortCode:portCodes[i],trackingBarcode:trackingbarcodes[i],qrCode:qrcodes[i],labelPrice:labelPrices[i],deliveryPoint:deliveryPoints[i]}
        })
        console.log(updateResult)
    }
}catch(error){
    console.log(error)
}
}
    
    
}

module.exports.updateOrderItemStatus = updateOrderItemStatus
