const {OrderItems} = require('../models/orderItem');
const {Darazid} = require('../models/darazid');
const {generateMultipleOrderItemsUrl} = require('../scripts/GenerateUrl');
const {GetData} = require('./HttpReq');
const {Order} = require('../models/order')
const {getOrderIdArray} = require('../scripts/GenerateUrl')

async function updateOrderItemStatus(){
    var darazid = await Darazid.find();
    //get All Shops in db
    darazid.forEach(async(shop) => {
        //get order with statuses of this shop
        splitCount=300
        var orderitemscount = await OrderItems.countDocuments({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        end = Math.ceil(orderitemscount/splitCount)
    for(let i=0;i<end;i++){
        var orderitems = await OrderItems.find({$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShopId:shop.shopid})
        .skip(i*splitCount)
        .limit(splitCount)
        
        url = await generateMultipleOrderItemsUrl(shop.shopid,shop.secretkey,getOrderIdArray(orderitems));
        orderitemsdata = await GetData(url);
        orderitemsdata = orderitemsdata.Orders[0].OrderItems
        // console.log(orderitemsdata)
        //iterate all orders fetched from api
        try{
        orderitemsdata.forEach(async(item)=>{
            //find fetched order
            var finditem = await OrderItems.findOne({OrderItemId:item.OrderItemId});
            //updating statuses
            if(finditem.Status!=item.Status){
                // console.log(findorder.Status+" "+order.Status);
                finditem.Status=item.Status;
                const result = await finditem.save();
            }
            //Update Tracking if tracking available
            if(finditem.TrackingCode==""){
                if(item.TrackingCode!="")
                {
                    finditem.TrackingCode=item.TrackingCode;
                    const result = await finditem.save();
                    // console.log(result);
                }
                
            }
             //New Updated Tracking if changed
            else if(finditem.TrackingCode!=item.TrackingCode)
            {
               
                finditem.UpdatedTracking=item.TrackingCode;
                const result = await finditem.save();
                // console.log(result);
            }
        })

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

module.exports.updateOrderItemStatus = updateOrderItemStatus
