const cron = require('node-cron');
const { upgradeFuturePackage } = require('./futureRequest');

function scheduler(){
    //future request cron at 12:01:01 every day
    cron.schedule('1 1 0 * * *',async ()=>{
        await upgradeFuturePackage();
    }, {
        scheduled: true,
        timezone: "Asia/Karachi"
    })
}

module.exports.scheduler = scheduler;
