const {OrderItems} = require('../models/orderItem');
const {Darazid} = require('../models/darazid');
const {generateMultipleOrderItemsUrl,generateLabelUrl} = require('../scripts/GenerateUrl');
const {GetData} = require('./HttpReq');
const {Order} = require('../models/order')
const {getOrderIdArray} = require('../scripts/GenerateUrl')
const cheerio = require('cheerio')
const atob = require("atob");

async function updateOrderItemUserWise(user,RtsOrdersResponse){
    console.log("status ",user)
    if(RtsOrdersResponse>0){
    // var darazid = await Darazid.find({useremail:user});
    // console.log(darazid)
    // //get All Shops in db
    // console.log("updating status")
    await updateOrderItemStatusAndUserWise(user,'pending')
    console.log("user status done")
}
    
}

async function updateOrderItemStatus(darazid){
    var darazid = await Darazid.find();

    for(var shop of darazid){
        //get order with statuses of this shop
        splitCount=150
        var orderitemscount = await OrderItems.countDocuments({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        // console.log(orderitemscount)
        end = Math.ceil(orderitemscount/splitCount)
        // console.log(end)
    for(let i=0;i<end;i++){
        var orderitems = await OrderItems.find({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        .skip(i*splitCount)
        .limit(splitCount)
        // console.log(shop.shopid+' '+orderitems.length)
        var orderitemsarray = getOrderIdArray(orderitems)
        // console.log(orderitemsarray)
        url = await generateMultipleOrderItemsUrl(shop.shopid,shop.secretkey,orderitemsarray);
        console.log(url)
        orderitemsdata = await GetData(url);
        // console.log(orderitemsdata.Orders)

        orderitemsdata = orderitemsdata.Orders
        //iterate all orders fetched from api
        try{
        for(var orders of orderitemsdata){
            for(item of orders.OrderItems){
                // console.log(item)
  
            //find fetched order
            var finditem = await OrderItems.findOne({OrderItemId:item.OrderItemId});
            
            //updating statuses
            // console.log(finditem.Status+" "+item.Status);
            if(finditem.Status!=item.Status){
                // console.log(finditem.Status+" "+item.Status);
                finditem.Status=item.Status;

            
            //Update Tracking if tracking available
            // console.log('existing tracking',finditem.TrackingCode,'daraz tracking',item.TrackingCode)
            if(finditem.TrackingCode==""){
                // console.log("Tracking first")
                if(item.TrackingCode!="")
                {
 
                    finditem.TrackingCode=item.TrackingCode;
                    finditem.ShipmentProvider=item.ShipmentProvider.substr(item.ShipmentProvider.indexOf(',')+2);
 
                }
                
            }
             //New Updated Tracking if changed
            else if(finditem.TrackingCode!=item.TrackingCode)
            {
                finditem.PreviousTracking=finditem.TrackingCode
                finditem.TrackingCode=item.TrackingCode;
                // console.log(result);
            }
            result = await finditem.save();

        }
        }
        }
 
        
    }
    catch(error){
        console.log(error);
    }
    }

    }
    console.log("Status Loop done");

    try {
        setTimeout(()=>{
            updateOrderItemStatus();
        },180000);
    } catch (error) {
        console.log(error);
    }
    

    
}

async function updateOrderItemStatusAndUserWise(user,status){
    var darazid = await Darazid.find({useremail:user});

    for(var shop of darazid){
        //get order with statuses of this shop
        splitCount=100
        var orderitemscount = await OrderItems.countDocuments({Status:status,ShopId:shop.shopid})
        // console.log(orderitemscount)
        end = Math.ceil(orderitemscount/splitCount)
        // console.log(end)
    for(let i=0;i<end;i++){
        var orderitems = await OrderItems.find({Status:status,ShopId:shop.shopid})
        .skip(i*splitCount)
        .limit(splitCount)
        // console.log(shop.shopid+' '+orderitems.length)
        var orderitemsarray = getOrderIdArray(orderitems)
        // console.log(orderitemsarray)
        url = await generateMultipleOrderItemsUrl(shop.shopid,shop.secretkey,orderitemsarray);
        orderitemsdata = await GetData(url);
        // console.log(orderitemsdata.Orders)

        orderitemsdata = orderitemsdata.Orders
        //iterate all orders fetched from api
        try{
        for(var orders of orderitemsdata){
            for(item of orders.OrderItems){
                // console.log(item)
  
            //find fetched order
            var finditem = await OrderItems.findOne({OrderItemId:item.OrderItemId});
            
            //updating statuses
            // console.log(finditem.Status+" "+item.Status);
            if(finditem.Status!=item.Status){
                // console.log(finditem.Status+" "+item.Status);
                finditem.Status=item.Status;

            
            //Update Tracking if tracking available
            if(finditem.TrackingCode==""){
                // console.log("Tracking first")
                if(item.TrackingCode!="")
                {
 
                    finditem.TrackingCode=item.TrackingCode;
                    finditem.ShipmentProvider=item.ShipmentProvider.substr(item.ShipmentProvider.indexOf(',')+2);
 
                }
                
            }
             //New Updated Tracking if changed
            else if(finditem.TrackingCode!=item.TrackingCode)
            {
                finditem.PreviousTracking=finditem.TrackingCode
                finditem.TrackingCode=item.TrackingCode;
                // console.log(result);
            }
            result = await finditem.save();

        }
        }
        }
 
        
    }
    catch(error){
        console.log(error);
    }
    }

    }
    

    console.log("Status Loop done");
}

async function fetchLabelsAndUpdate(useremail){
    console.log("labels ",useremail)
    darazid = await Darazid.find({useremail:useremail})
    for(shop of darazid){
        var orderitemsIds=[]
        items= await OrderItems.find({ShopId:shop.shopid,Status:'ready_to_ship',PortCode:'',ShippingType:'Dropshipping'})
        // console.log(items)
        for(item of items){
            orderitemsIds.push(item.OrderItemId)
        }
        await updateOrderItemPortCodes(shop.shopid,shop.secretkey,orderitemsIds)
    }
}

async function updateOrderItemPortCodes(shopid,secretkey,orderItemIds){
    console.log(orderItemIds,orderItemIds.length)
    console.log("Entry Checkpoint")
    var portCodes=[]
    var trackings=[]
    trackingbarcodes=[]
    portcodebarcodes=[]
    // orderidbarcodes=[]
    qrcodes=[]
    deliveryPoints=[]
    labelPrices=[]

    splitCount=35
    lastCount=0
    
    for(let j=0;j<Math.ceil(orderItemIds.length/splitCount);j++){
        var portCodes=[]
        var trackings=[]
        trackingbarcodes=[]
        portcodebarcodes=[]
        // orderidbarcodes=[]
        qrcodes=[]
        deliveryPoints=[]
        labelPrices=[]
        console.log("First Loop")
    
    OrderItemStringArray='['
    end=lastCount+splitCount

    if(orderItemIds.length<=end) {end=orderItemIds.length}
    for(let i=lastCount;i<end;i++){
        OrderItemStringArray=OrderItemStringArray+orderItemIds[i]+','
        lastCount++
    }
    OrderItemStringArray=OrderItemStringArray+']'
    console.log(OrderItemStringArray) 

    try{
    url = generateLabelUrl(shopid,secretkey,OrderItemStringArray)
    var data = await GetData(url)
    console.log("1st Checkpoint")
    var result = atob(data.Document.File)
    const $=cheerio.load(result)
        //scrape portcodes
    $("div").find('div:nth-child(5)').each(function(index,element){
        PortCode=$(element).text().substr(14)
        PortCode=PortCode.trim()
        portCodes.push(PortCode)
    });
    //scrape Tracking to search
    $("div").find('div:nth-child(4)').each(function(index,element){
        Tracking=$(element).text().substr(20)
        Tracking = Tracking.trim()
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

    $('div[class="box left qrcode"]').find('img').each(function(index,element){

            qrcodes.push($(element).attr('src'))

    });
    console.log("2nd Checkpoint")
    console.log(trackings.length)


    for(let i=0;i<trackings.length;i++){
        console.log("3rd Checkpoint")


        updateResult = await OrderItems.updateMany({TrackingCode:trackings[i].toString()},{
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
module.exports.updateOrderItemUserWise = updateOrderItemUserWise
module.exports.fetchLabelsAndUpdate = fetchLabelsAndUpdate
module.exports.updateOrderItemStatusAndUserWise=updateOrderItemStatusAndUserWise
