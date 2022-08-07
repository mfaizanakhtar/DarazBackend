const mongoose = require('mongoose');
const express = require('express');
const app = express();
const config = require('config');
const darazapi = require('./routes/darazapi');
const users = require('./routes/users')
const auth = require('./routes/auth');
const darazid = require('./routes/darazids');
const orderitems = require('./routes/orderItems');
const transactions = require('./routes/transactions')
const dashboards = require('./routes/dashboards');
const { OrderItems } = require('./models/orderItem');
const orders = require('./routes/orders');
const skus = require('./routes/skus');
const darazskus=require('./routes/darazskus')
const {updateOrdersData,updateSingleOrder} = require('./scripts/updateOrders');
const {updateOrderItemStatus} = require('./scripts/updateStatus')
const {generateSingleOrderUrl,RtsURL, generateMultipleOrderItemsUrl} = require('./scripts/GenerateUrl');
const {updateTransactions} = require("./scripts/updateFinance");
const  {generateLabelUrl} = require("./scripts/GenerateUrl");
const {GetData} = require('./scripts/HttpReq')
const cheerio = require('cheerio')
const atob = require("atob");
const {getSkus, getAllSkus,updateAllSkus} = require('./scripts/updateSku');
const { plans } = require('./routes/plans');
const { dataQueries } = require('./scripts/insertData');
const { lookups } = require('./routes/lookups');
const { billings } = require('./routes/billings');
const { schedulerRouter } = require('./routes/scheduler');
const { scheduler } = require('./scripts/scheduler');
 
mongoose.connect(config.connectionstring,{useFindAndModify:false,useNewUrlParser:true,useUnifiedTopology:true,useCreateIndex:true})
    .then(()=>{
        console.log(`Connected ${config.connectionstring}`)
    })
    .catch((ex)=>{
        console.log(ex)
        console.log("Error");
    });

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Methods',"PUT, GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Origin", "*"); // keep this if your api accepts cross-origin requests
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, auth-token");
    next();
})

app.use(express.json({limit: '50mb'}));
app.use('/api/darazapi',darazapi);
app.use('/api/users',users);
app.use('/api/auth',auth);
app.use('/api/darazid',darazid);
app.use('/api/orderitems',orderitems);
app.use('/api/orders',orders)
app.use('/api/skus',skus)
app.use('/api/transactions',transactions)
app.use('/api/darazskus',darazskus)
app.use('/api/dashboard',dashboards)
app.use('/api/plans',plans)
app.use('/api/lookups',lookups)
app.use('/api/billings',billings)
app.use('/api/scheduler',schedulerRouter)

scheduler();

dataQueries()



// async function updateId(){
//     const result = await OrderItems.updateMany({},{
//         $set:{useremail:'accesology@gmail.com'}
//     })
//     console.log("email update query")
//     console.log(result)
// }
// updateId()
// updateSingleOrder('pkgadgies@gmail.com','131329258345032')
// // updateOrderItemStatus();
// // updateItemPendingStatus();
// // updatePendingOrderStatus();
// // getSkus('techatronixs@gmail.com','["45CM+7FT","Holder5208"]')




// updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],
// ShippingType:'Dropshipping',DispatchDate:null},180000);

// updateOrderItemStatus({},{Status:'delivered',
// ShippingType:'Dropshipping'})

// labelFetch()
// async function labelFetch(){


// var label = generateLabelUrl('pkgadgies@gmail.com','k_sD4SRfN8-aVu7wRN6CND6LVVCD4oRpat4RN5YPcx6jeYVM0-aPpfls','[129603020813712,119335182660597]')
// var portCodes=[]
// var trackings=[]

// console.log(label)
// data = await GetData(label)
// var result = atob(data.Document.File)
// const $=cheerio.load(result)

// $("div").find('div:nth-child(11)').each(function(index,element){
//         // PortCode=$(element).text().substr(14)
//         // PortCode=PortCode.substr(0,PortCode.length-1)
//         // portCodes.push(PortCode)
//         // console.log($(element).text())
// });
// $("div:nth-child(2)").find('div:nth-child(1)').each(function(index,element){
//     // PortCode=$(element).text().substr(14)
//     // PortCode=PortCode.substr(0,PortCode.length-1)
//     // portCodes.push(PortCode)
//     console.log($(element).text().substr(13))
// });
// // $("div").find('div:nth-child(4)').each(function(index,element){

// //     Tracking=$(element).text().substr(20)
// //     Tracking = Tracking.substr(0,Tracking.length-1)
// //     trackings.push(Tracking)
// // });
// // $('div[class=barcode]').find('img').each(function(index,element){

// //     if((index % 3==0)){
// //         // console.log($(element).attr('src'))
// //         // console.log(index)
// //     }
    
// // });
// // $('div[class="box left qrcode"]').find('img').each(function(index,element){


// //         // console.log($(element).attr('src'))
// //         // console.log(index)
    
    
// // });
// // $('div[class=barcode]').find('img').each(function(index,element){



// //         console.log($(element).attr('src'))
// //         console.log(index)



// // });
// // console.log(portCodes)
// // console.log(trackings)

// }

// getShipmentProviders()
// async function getShipmentProviders(){
//     var providers = await OrderItems.aggregate([
//         {
//             $group:{_id:"$ShipmentProvider"}
//         }
//     ])
//     console.log(providers)
// }

// console.log(RtsURL('accesology@gmail.com','j6hn60ggpQaDUW1nR2kXZ6vN1JUjIAxPJrQZdWmiMFsqvc3DZCjxTZYs','[130295377502752,129666658371249]'))
// console.log(generateMultipleOrderItemsUrl('accesology@gmail.com','j6hn60ggpQaDUW1nR2kXZ6vN1JUjIAxPJrQZdWmiMFsqvc3DZCjxTZYs',"[133492028676272]"))


const port = process.env.PORT || 3000;
const server = app.listen(port,()=> console.log(`Listening on port ${port}. NODE_ENV -> ${config.util.getEnv('NODE_ENV')}`));

module.exports = server;

