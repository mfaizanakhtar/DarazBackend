const {GetData} = require('./HttpReq')
const {generateTransactionsUrl} = require('../service/GenerateUrl')
const {Shop} =require('../models/shop');
const {Transaction} = require('../models/transaction')
const {OrderItems} = require('../models/orderItem');
const { previousDataQuery } = require('../models/previousDataQuery');
const moment = require('moment');

async function updateTransactions(){
    try{
    let shops = await Shop.find()
    transactionTypes=[-1]
    // transactionTypes=[13,8,16,3,28,14,85,15,145,104,4,-1]
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
    let limit = 500
    // console.log(dates)
    for(shop of shops){
        try{
            for(transType of transactionTypes){
                lastIteration=false
                let offSet=0;
                while(!lastIteration){
                    // let alreadyInDbcount=0;
                    //get Url for transaction
                    url= generateTransactionsUrl(shop.accessToken,transType,moment().subtract('2','days').format("yyyy-MM-DD"),moment().format("yyyy-MM-DD"),limit,offSet*limit)
                    // console.log(url)
                    //get transactions data
                    let transactions = await GetData(url);
                    if(transactions!=null){
                    let previousTransactionsData = await previousDataQuery.find({shopShortCode:shop.shortCode,queryData:JSON.stringify(transactions),queryType:"transType="+transType+"offSet="+offSet})
                    if(transactions.length<500){
                        console.log("Last Iteration Length: "+transactions.length)
                        lastIteration=true
                    }
                    if(previousTransactionsData.length<=0){
                        console.log(transactions)
                    for(let t of transactions){
                        //check if transactions is in db
                        let transaction = await Transaction.find({TransactionNumber:t.transaction_number,ShopShortCode:shop.shortCode,userEmail:shop.userEmail})
                        let increment
                        // console.log(t)
                        increment={$inc:{TransactionsPayout:parseInt(t.amount)}}
                        if(transaction.length>0){
                            if(transaction.OrderItemUpdated==false){
    
                                let updateResult = await OrderItems.updateMany({OrderItemId:transaction.OrderItemNo,ShopShortCode:shop.shortCode},{
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
                        transaction = getTransactionObj(t,shop,transType)
                        let transactResult
                        try{
                            transactResult = await transaction.save()
                            // alreadyInDbcount++
                        }catch(ex){
                            console.log("Transaction already exists")
                        }
    
                        //find corresponding order and push transaction into order obj
                        if(transactResult){
                            let updateResult = await OrderItems.updateMany({OrderItemId:transactResult.OrderItemNo,ShopShortCode:shop.shortCode},{
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
                    }
                        
                    };
                    previousTransactionsData = await previousDataQuery.find({ShopId:shop.shopid,queryType:"transType="+transType})
                    console.log("New Transactions Found")
                    if(previousTransactionsData.length>0){
                        await previousDataQuery.updateMany({shopShortCode:shop.shortCode,queryType:"transType="+transType+"offSet="+offSet},{queryData:JSON.stringify(transactions)})
                    }else await new previousDataQuery({shopShortCode:shop.shortCode,queryData:JSON.stringify(transactions),queryType:"transType="+transType+"offSet="+offSet}).save()
                }
                }else{
                    console.log("Invalid username or secretkey of shop "+ shop.name)
                }
            offSet++
            // if((alreadyInDbcount/transactionsLength)>=0.8) break;
        }
            }
        }catch(ex){
            console.log("Problem fetching transactions for shop: "+shop.name)
        }
}
    console.log("Transaction Loop Done")
}
catch(ex){
    console.log("Error in updateTransactions, error:"+ex)
}
}

function getTransactionObj(t,shop,transType){
    let transaction = new Transaction({
        TransactionDate:t.transaction_date,
        TransactionType:t.transaction_type,
        FeeName:t.fee_name,
        TransactionNumber:t.transaction_number,
        Details:t.details,
        SellerSku:t.seller_sku,
        LazadaSku:t.lazada_sku,
        Amount:t.amount,
        VATinAmount:t.VAT_in_amount,
        Statement:t.statement,
        PaidStatus:t.paid_status,
        OrderNo:t.orderItem_no,
        OrderItemNo:t.orderItem_no,
        OrderItemStatus:t.orderItem_status,
        ShippingSpeed:t.shipping_speed,
        ShipmentType:t.shipment_type,
        Reference:t.reference,
        PaymentRefId:t.reference,
        ShopShortCode:shop.shortCode,
        ShopName:shop.name,
        userEmail:shop.userEmail,
        transType:transType
    })

    return transaction
}

module.exports.updateTransactions = updateTransactions