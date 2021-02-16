const mongoose = require('mongoose');
const express = require('express');
const app = express();
const config = require('config');
const darazapi = require('./routes/darazapi');
const users = require('./routes/users')
const auth = require('./routes/auth');
const darazid = require('./routes/darazids');
const order = require('./routes/orders');
const api = require('./update');




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
app.use('/api/orders',order);

// setInterval(api.test,5000);
// api.test();
// function test(){
//     console.log("test");
// }
// console.log(api.test(userID,secretkey,0));
// setInterval(test,100);
// setTimeout(api.UpdateData,300000);
// setInterval(api.updateStatus,10000);

api.UpdateData();
api.updateStatus();

const port = process.env.PORT || 3000;
const server = app.listen(port,()=> console.log(`Listening on port ${port}`));

module.exports = server;

