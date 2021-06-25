const mongoose = require('mongoose');
const express = require('express');
const app = express();
const config = require('config');
const darazapi = require('./routes/darazapi');
const users = require('./routes/users')
const auth = require('./routes/auth');
const darazid = require('./routes/darazids');
const orderitems = require('./routes/orderItems');
const orders = require('./routes/orders');
const {updateOrdersData} = require('./scripts/updateOrders');
const {updateItemPendingStatus,updateOrderItemStatus,updatePendingOrderStatus} = require('./scripts/updateStatus')
const {generateSingleOrderUrl} = require('./scripts/GenerateUrl');
const {updateTransactions} = require("./scripts/updateFinance");

mongoose.connect(config.connectionstring)
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

app.use(express.json());
app.use('/api/darazapi',darazapi);
app.use('/api/users',users);
app.use('/api/auth',auth);
app.use('/api/darazid',darazid);
app.use('/api/orderitems',orderitems);
app.use('/api/orders',orders)


updateOrdersData()
updateOrderItemStatus();
// updateItemPendingStatus();
// updatePendingOrderStatus();
updateTransactions();

// url = generateSingleOrderUrl("techmart73@gmail.com","M7kLg0PM2dIOOc8yhBdznzq5jc4ULf6kFy5vczlXfLqQxzN3gcS9atdw",110984852507016)
// console.log(url);

const port = process.env.PORT || 3000;
const server = app.listen(port,()=> console.log(`Listening on port ${port}`));

module.exports = server;

