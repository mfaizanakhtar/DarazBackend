const cron = require('node-cron');
const { upgradeFuturePackage } = require('./futureRequest');
const { updateTransactions } = require('./updateFinance');
const { updateOrdersData } = require('./updateOrders');
const { getAllSkus, updateAllSkus } = require('./updateSku');
const { updateOrderItemStatus } = require('./updateStatus');

function scheduler(){
    //future request cron at 12:01 every day
    cron.schedule('1 0 * * *',async ()=>{
        await upgradeFuturePackage();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //new orders request cron at every 5minutes
    cron.schedule('*/5 * * * *',async ()=>{
        await updateOrdersData();
        console.log("updateOrderItemStatus @ every 5 minutes")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //new transaction request cron at every 1 hour
    cron.schedule('* */1 * * *',async ()=>{
        await updateTransactions();
        console.log("updateOrderItemStatus @ every 1 hours")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('* */8 * * *',async ()=>{
        await updateOrderItemStatus({},{$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShippingType:'Own Warehouse'});
        console.log("updateOrderItemStatus @ every 8 hours")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('* */8 * * *',async ()=>{
        await updateOrderItemStatus({},{Status:'shipped',ShippingType:'Dropshipping'});
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 15 minutes
    cron.schedule('*/15 * * * *',async ()=>{
        await updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],ShippingType:'Dropshipping'});
        console.log("updateOrderItemStatus @ every 12 minutes")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('* */8 * * *',async ()=>{
        var startingDate=new Date();
        startingDate=startingDate.setDate(startingDate.getDate()-20)
        await updateOrderItemStatus({},{Status:'delivered',UpdatedAt:{$gte:startingDate}},8*60*60*1000);
        console.log("updateOrderItemStatus @ every 8 hours")

    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

        
    //update status request cron at every 12 hours
    cron.schedule('* */12 * * *',async ()=>{
        await getAllSkus()
        console.log("getAllSkus @ every 12 hours")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 1 hour
    cron.schedule('* */1 * * *',async ()=>{
        await updateAllSkus()
        console.log("updateAllSkus @ every hour")
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

}

module.exports.scheduler = scheduler;
