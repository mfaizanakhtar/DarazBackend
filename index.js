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
const { OrderItems } = require('./models/orderItem');
const orders = require('./routes/orders');
const skus = require('./routes/skus');
const {updateOrdersData,updateSingleOrder} = require('./scripts/updateOrders');
const {updateOrderItemStatus} = require('./scripts/updateStatus')
const {generateSingleOrderUrl,RtsURL} = require('./scripts/GenerateUrl');
const {updateTransactions} = require("./scripts/updateFinance");
const  {generateLabelUrl} = require("./scripts/GenerateUrl");
const {GetData} = require('./scripts/HttpReq')
const cheerio = require('cheerio')
const atob = require("atob");
 

mongoose.connect(config.connectionstring,{useFindAndModify:false})
    .then(()=>{
        console.log(`Connected ${config.connectionstring}`)
    })
    .catch(()=>{
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


// async function updateId(){
//     const result = await OrderItems.updateMany({},{
//         $set:{useremail:'accesology@gmail.com'}
//     })
//     console.log("email update query")
//     console.log(result)
// }
// updateId()
// updateSingleOrder('pkgadgies@gmail.com','131329258345032')
updateOrdersData();
// updateOrderItemStatus();
// updateItemPendingStatus();
// updatePendingOrderStatus();
updateTransactions();

updateOrderItemStatus({},{$or:[{Status:'shipped'},{ Status:'ready_to_ship'},{ Status:'pending'}],
ShippingType:'Own Warehouse'},18000000);

updateOrderItemStatus({},{$or:[{Status:'shipped'}],
ShippingType:'Dropshipping'},3000000);

updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],
ShippingType:'Dropshipping',DispatchDate:{$ne:null}},180000);

updateOrderItemStatus({},{$or:[{Status:'pending'},{ Status:'ready_to_ship'}],
ShippingType:'Dropshipping',DispatchDate:null},180000);

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


const port = process.env.PORT || 3000;
const server = app.listen(port,()=> console.log(`Listening on port ${port}`));

module.exports = server;

