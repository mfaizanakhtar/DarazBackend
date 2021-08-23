const {GetData} = require('./HttpReq')
const {generateTransactionsUrl} = require('./GenerateUrl')
const {Darazid} =require('../models/darazid');
const {Transaction} = require('../models/transaction')
const {OrderItems} = require('../models/orderItem')

async function updateTransactions(){
    try{
    var shopids = await Darazid.find()
    //get start and enddate for query
    date = getDates()
    for(shopid of shopids){
        //get Url for transaction
        url= generateTransactionsUrl(shopid.shopid,shopid.secretkey,date.start,date.end,300)
        //get transactions data
        var transactions = await GetData(url);
        transactions = transactions.TransactionDOs.transactionDOs
        // console.log(shopid.shopid+" "+transactions.length);
        for(var t of transactions){
            //check if transactions is in db
            var transaction = await Transaction.find({TransactionNumber:t["Transaction Number"]})
            if(transaction.length==0){
                //if not found, save into db
                var transaction = getTransactionObj(t,shopid.useremail)
            transactResult = await transaction.save()
            // console.log(transactResult)
            //find corresponding order and push transaction into order obj
            OrderItems.update({OrderItemId:transactResult.OrderItemNo},{
                $push:{Transactions:transactResult._id}
            })
        }
            
        };
    };
    console.log("Transaction Loop Done")
}
catch(ex){
    console.log(ex)
}
try{
    setTimeout(()=>{
        updateTransactions();
    },300000);
}
catch(ex){
    console.log(ex)
}
}

function getTransactionObj(t,useremail){
    var transaction = new Transaction({
        TransactionDate:t["Transaction Date"],
        TransactionType:t["Transaction Type"],
        FeeName:t["Fee Name"],
        TransactionNumber:t["Transaction Number"],
        Details:t["Details"],
        SellerSku:t["Seller SKU"],
        LazadaSku:t["Lazada SKU"],
        Amount:t["Amount"],
        VATinAmount:t["VAT in Amount"],
        Statement:t["Statement"],
        PaidStatus:t["Paid Status"],
        OrderNo:t["Order No."],
        OrderItemNo:t["Order Item No."],
        OrderItemStatus:t["Order Item Status"],
        ShippingSpeed:t["Shipping Speed"],
        ShipmentType:t["Shipment Type"],
        Reference:t["Reference"],
        PaymentRefId:t["Payment Ref Id"],
        useremail:useremail
    })

    return transaction
}

function getDates(){
    date = new Date();
    var dd = String(date.getDate()).padStart(2,'0');
    var mm = String(date.getMonth()+1).padStart(2,'0');
    var yyyy = date.getFullYear();
    var startdate = dd
    var startmonth = mm
    var startyear = yyyy
    if(startdate=='01'){
        if(startmonth=='01'){
            startdate='31'
            startmonth='12'
            startyear=startyear-1
        }
        else if(startmonth=='03'){
            startdate='28'
            startmonth='02'
        }
        else if(startmonth=="2"||startmonth=="6"||startmonth=="8"||startmonth=="9"||startmonth=="11"){
            startdate='31'
            startmonth=startmonth-1
        }
        else{
            startdate='30'
            startmonth=startmonth-1
        }
    }

    return {start:startyear+"-"+startmonth+"-"+startdate,end:yyyy+"-"+mm+"-"+dd}
}

module.exports.updateTransactions = updateTransactions