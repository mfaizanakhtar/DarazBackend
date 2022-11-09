const xmlJs = require('xml-js');
const { darazSku } = require('../models/darazsku');
const { Shop } = require('../models/shop');
const { PostData } = require('../scripts/HttpReq');
const { getSkus, updateSkuPriceQuantity } = require('../scripts/updateSku');
const { postUpdatePriceQuantity } = require('./GenerateUrl');


async function updatePriceQuantity(skuId,userEmail,request){
    return new Promise(async(resolve,reject)=>{
        try{
            let dSku = await darazSku.findOne({_id:skuId,userEmail:userEmail})
            if(!dSku){
                reject({message:"No such Sku Found"})
            }
            let stockPriceResult = createStockPriceBody(dSku,request)
            let shopResult = await Shop.findOne({shortCode:dSku.ShopShortCode,userEmail:userEmail})
            let postUrl = postUpdatePriceQuantity(shopResult.accessToken,stockPriceResult.xmlRequest)
            let postResponse = await PostData(postUrl)
            if(postResponse.code=='0'){
                dSku = await updateSkuPriceQuantity(dSku._id,stockPriceResult.SkuJson)
                resolve({message:"success",updatedSku:dSku})
            }reject({message:"Error occured"})
        
    }catch(ex){
        reject({message:ex.message});
    }})
}

function createStockPriceBody(dSku,request){
    try{
        let SkuJson={
            ItemId: dSku.itemId,
            SkuId: dSku.SkuId,
            SellerSku: dSku.SellerSku
        }
        
        let additionalParams={}
        if(request.price && dSku.price!=request.price){
            additionalParams={...additionalParams,Price:request.price}
        }
        if(request.special_from_date || request.special_to_date){
            request.special_from_date = request.special_from_date!=null ? request.special_from_date.substring(0,10) : null
            request.special_to_date = request.special_to_date!=null ? request.special_to_date.substring(0,10) : null
        }
        if(request.special_price && request.special_from_date && request.special_to_date){
            additionalParams={...additionalParams,SalePrice:request.special_price,SaleStartDate:request.special_from_date,SaleEndDate:request.special_to_date}
        }
        if(request.quantity && dSku.FBMstock.quantity!=request.quantity){
            additionalParams={...additionalParams,Quantity:request.quantity}
        }
        if(Object.keys(additionalParams).length==0){
            throw new Error("No Changes Detected")
        }else{
            SkuJson={...SkuJson,...additionalParams}
        }

        let stockPriceRequest = {
            request:{
                Product:{
                    Skus:{
                        Sku:SkuJson
                    }
                }
            }
        }

        let xmlRequest = xmlJs.json2xml(stockPriceRequest,{compact: true, ignoreComment: true, spaces: 0})
        console.log(xmlRequest)
        return {xmlRequest:xmlRequest,SkuJson}
    }catch(ex){
        throw ex;
    }
}

module.exports.updatePriceQuantity = updatePriceQuantity