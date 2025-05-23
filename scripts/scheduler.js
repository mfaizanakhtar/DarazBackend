const cron = require('node-cron');
const { upgradeFuturePackage } = require('./futureRequest');
const { updateTransactions } = require('./updateFinance');
const { updateOrdersData, updateOrdersOnConfiguredOrderStatuses } = require('./updateOrders');
const { getAllSkus, updateAllSkus } = require('./updateSku');
const { updateOrderItemStatus } = require('./updateStatus');
const { refreshAccessToken } = require('../service/shopService');

function scheduler(){
    //future request cron at 12:01 every day
    cron.schedule('1 0 * * *',async ()=>{
        await upgradeFuturePackage();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //token refresh request cron at 12:01 every day
    cron.schedule('1 0 * * *',async ()=>{
        await refreshAccessToken()
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //new orders request cron at every 5minutes
    cron.schedule('0 */5 * * * *',async ()=>{
        await updateOrdersData();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //new orders request for specific statuses cron at every 5minutes
    cron.schedule('0 */5 * * * *',async ()=>{
        await updateOrdersOnConfiguredOrderStatuses();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //new transaction request cron at every 8 hour
    cron.schedule('0 0 */6 * * *',async ()=>{
        await updateTransactions();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('0 0 */8 * * *',async ()=>{
        await updateOrderItemStatus({},{$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],ShippingType:'Own Warehouse'});
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('0 0 */8 * * *',async ()=>{
        await updateOrderItemStatus({},{Status:'shipped',ShippingType:'Dropshipping'});
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 15 minutes
    cron.schedule('0 */15 * * * *',async ()=>{
        await updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],ShippingType:'Dropshipping'});
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 8 hours
    cron.schedule('0 0 */8 * * *',async ()=>{
        var startingDate=new Date();
        startingDate=startingDate.setDate(startingDate.getDate()-20)
        await updateOrderItemStatus({},{Status:'delivered',UpdatedAt:{$gte:startingDate}},8*60*60*1000);
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

        
    //update status request cron at every 12 hours
    cron.schedule('0 0 */12 * * *',async ()=>{
        await getAllSkus()
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

    //update status request cron at every 1 hour
    cron.schedule('0 0 */1 * * *',async ()=>{
        await updateAllSkus()
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })

}

module.exports.scheduler = scheduler;
