const {GetData} = require('./HttpReq')
const {generateTransactionsUrl} = require('./GenerateUrl')
const {Darazid} =require('../models/darazid');
const {Transaction} = require('../models/transaction')
const {OrderItems} = require('../models/orderItem');
const { previousDataQuery } = require('../models/previousDataQuery');

async function updateTransactions(){
    try{
    var shops = await Darazid.find()
    // transactionTypes=[-1]
    transactionTypes=[13,8,16,3,28,14,85,15,145,104,4,-1]
    //13 - Item Price Credit
    //8 - Shipping Fee (Paid By Customer)
    //16 - Commission
    //3 - Payment Fee
    //28 - Automatic Shipping Fee
    //14 - Reversal Item Price
    //85 - Lost And Damaged Claim
    //15 - Reversal Commission
    //145 - Other Debits (Returns)
    //104 - Adjustments Others
    //get start and enddate for query
    var dates = getDates()
    // console.log(dates)
    for(shop of shops){
        for(date of dates){
        for(transType of transactionTypes){
        //get Url for transaction
        url= generateTransactionsUrl(shop.shopid,shop.secretkey,date,transType)
        // console.log(url)
        //get transactions data
        var transactions = await GetData(url);
        if(transactions!=null){
        transactions = transactions.TransactionDOs.transactionDOs
        var previousTransactionsData = await previousDataQuery.find({ShopId:shop.shopid,queryData:JSON.stringify(transactions),queryType:"transType"+transType+date})

        if(previousTransactionsData.length<=0){

        for(var t of transactions){
            //check if transactions is in db
            if(!t.hasOwnProperty("Transaction Type")) break;
            var transaction = await Transaction.find({TransactionNumber:t["Transaction Number"],useremail:shop.useremail})
            var increment
            // console.log(t)
            if(t["Fee Name"]=="Automatic Shipping Fee") increment={$inc:{TransactionsPayout:-t["VAT in Amount"]}}
            else if(t["Fee Name"]=="Shipping Fee (Paid By Customer)") increment={$inc:{TransactionsPayout:0}}
            else increment={$inc:{TransactionsPayout:t["Amount"]}}
            if(transaction.length>0){
                if(transaction.OrderItemUpdated==false){

                    var updateResult = await OrderItems.updateMany({OrderItemId:transaction.OrderItemNo},{
                        $push:{Transactions:
                                {
                                _id:transaction._id,
                                TransactionType:transaction.TransactionType,
                                FeeName:transaction.FeeName,
                                Amount:transaction.Amount,
                                VATinAmount:transaction.VATinAmount,
                                Statement:transaction.Statement
                                }
                            },
                        ...increment,
                        PayoutCycle:transaction.Statement
                    })
                
                if(updateResult.n>0){
                    await Transaction.updateMany({_id:transactResult._id},{OrderItemUpdated:true})
                }

                }
            }
            else if(transaction.length==0){
                //if not found, save into db
            var transaction = getTransactionObj(t,shop.useremail,shop.shopid,transType)
            transactResult = await transaction.save()
            //find corresponding order and push transaction into order obj
            var updateResult = await OrderItems.updateMany({OrderItemId:transactResult.OrderItemNo},{
                $push:{Transactions:
                        {
                        _id:transactResult._id,
                        TransactionType:transactResult.TransactionType,
                        FeeName:transactResult.FeeName,
                        Amount:transactResult.Amount,
                        VATinAmount:transactResult.VATinAmount,
                        Statement:transactResult.Statement
                        }
                    },
                ...increment,
                PayoutCycle:transaction.Statement
            })
            if(updateResult.n>0){
                await Transaction.updateMany({_id:transactResult._id},{OrderItemUpdated:true})
            }
        }
            
        };
        previousTransactionsData = await previousDataQuery.find({ShopId:shop.shopid,queryType:"transType"+transType})
        console.log("New Transactions Found")
        if(previousTransactionsData.length>0){
            await previousDataQuery.updateMany({ShopId:shop.shopid,queryType:"transType"+transType+date},{queryData:JSON.stringify(transactions)})
        }else await new previousDataQuery({ShopId:shop.shopid,queryData:JSON.stringify(transactions),queryType:"transType"+transType+date}).save()
    }
    }else{
        console.log("Invalid username or secretkey of shop "+ shop.shopName)
    }
    }
    };
}
    console.log("Transaction Loop Done")
}
catch(ex){
    console.log("Error in updateTransactions, error:"+ex)
}
}

function getTransactionObj(t,useremail,shopid,transType){
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
        ShopId:shopid,
        useremail:useremail,
        transType:transType
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
        else if(startmonth=="02"||startmonth=="06"||startmonth=="08"||startmonth=="09"||startmonth=="11"){
            startdate='31'
            startmonth=startmonth-1
        }
        else{
            startdate='30'
            startmonth=startmonth-1
        }
    }
    else{
        startdate=startdate-1
        startdate = String(startdate).padStart(2,0)
    }
    return [startyear+"-"+startmonth+"-"+startdate,yyyy+"-"+mm+"-"+dd]
}

module.exports.updateTransactions = updateTransactions