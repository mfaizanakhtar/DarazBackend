const {GetData} = require('./HttpReq')
const {generateSkuUrl} = require('../service/GenerateUrl')
const {Shop} = require('../models/shop')
const {darazProduct} = require('../models/darazproduct')
const {darazSku} = require('../models/darazsku')
const {Sku} = require('../models/sku')
const {updateOrderItemStatus} = require('../scripts/updateStatus')
const LazadaAPI = require('lazada-open-platform-sdk')
const {darazOpenAppDetails} = require('../data/data')
const moment = require('moment')

async function getSkus(shop,skus){
    try{

        var Url
        splitCount=50
        var skuitemscount = skus.length
        
        var end = Math.ceil(skuitemscount/splitCount)
    
        for(let i=0;i<end;i++){
            if(skus!=undefined){
                skus=skus.map(sku=>'"'+sku+'"')
                Url = generateSkuUrl(shop.accessToken,"all",splitCount,splitCount*i,'['+skus.slice(i*splitCount,(i*splitCount)+splitCount).toString()+']')
            }
            
            // console.log(Url)
            var ProductSku = await GetData(Url)
            if(ProductSku!=null){
            var Products = ProductSku.products
            for(product of Products){
                var upsertedSkuIds=[]
                for(const [i,sku] of product.skus.entries()){
                    
                    sku.ShopShortCode=shop.shortCode
                    sku.ShopName=shop.name
                    sku.userEmail=shop.userEmail
                    
                    var result = null
                    result = await CompileFbdFbmStock(sku)
                    sku.FBMstock = result.FBMstock
                    sku.FBDstock = result.FBDstock
                    sku.updatedAt = moment().toDate();
                    sku.itemId=product.item_id;

                skuResult = await darazSku.updateOne(
                    {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:sku},
                    {upsert:true}
                )
                if(skuResult.upserted && skuResult.upserted.length>0){
                    upsertedSkuIds = skuResult.upserted.map(result=>result._id)
                }
                }
                await darazProduct.updateOne(
                    {ItemId:product.item_id,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:createProductObj(product,upsertedSkuIds)},
                    {upsert:true}
                )
            }
        }
    }
}catch(ex){
    console.log("Error in getSkus error: "+ex)
}
}

function createProductObj(product,skus){
    var darazProduct = {
        PrimaryCategory:product.primary_category,
        ItemId:product.item_id,
        createdTime:moment(parseInt(product.created_time)),
        updatedTime:moment(parseInt(product.updated_time)),
        Attributes:product.attributes,
        skus:skus
    }

    return darazProduct
}

async function updateAllSkus(){
    try{
    shops = await Shop.find()
    for(var shop of shops){
        
        splitCount=30
        var skuitemscount = await darazSku.countDocuments({ShopShortCode:shop.shortCode})
        
        end = Math.ceil(skuitemscount/splitCount)
        
        for(let i=0;i<end;i++){
            var AllShopSkus = await darazSku.find({ShopShortCode:shop.shortCode})
            .skip(i*splitCount)
            .limit(splitCount)
            if(skus!=undefined){
                skus=AllShopSkus.map(sku=>'"'+sku.SellerSku+'"')
                AllShopSkusUrl = generateSkuUrl(shop.accessToken,"all",splitCount,splitCount*i,'['+skus.slice(i*splitCount,(i*splitCount)+splitCount).toString()+']')
            }
            
            // console.log(Url)
            var ProductSku = await GetData(AllShopSkusUrl)
            if(ProductSku!=null){
            var Products = ProductSku.products
            for(product of Products){
                var upsertedSkuIds=[]
                for(const [i,sku] of product.skus.entries()){
                    
                    sku.ShopShortCode=shop.shortCode
                    sku.ShopName=shop.name
                    sku.userEmail=shop.userEmail
                    
                    var result = null
                    result = await CompileFbdFbmStock(sku)
                    sku.FBMstock = result.FBMstock
                    sku.FBDstock = result.FBDstock
                    sku.updatedAt = moment().toDate();
                    sku.itemId=product.item_id;

                skuResult = await darazSku.updateOne(
                    {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:sku},
                    {upsert:true}
                )
                if(skuResult.upserted && skuResult.upserted.length>0){
                    upsertedSkuIds = skuResult.upserted.map(result=>result._id)
                }
                }
                await darazProduct.updateOne(
                    {ItemId:product.item_id,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:createProductObj(product,upsertedSkuIds)},
                    {upsert:true}
                )
            }
        }
        }
    }
}catch(ex){
    console.log("Exception occured at updateAllSkus, error: "+ex)
}
}

async function getAllSkus(){
    shops = await Shop.find()
    var Url;
    for(var shop of shops){

            Url = generateSkuUrl(shop.accessToken,"all",0,0,'[]')

            // console.log(Url)
            var ProductSku = await GetData(Url)
            if(ProductSku!=null){
            var Products = ProductSku.products
            for(product of Products){
                var upsertedSkuIds=[]
                for(const [i,sku] of product.skus.entries()){
                    
                    sku.ShopShortCode=shop.shortCode
                    sku.ShopName=shop.name
                    sku.userEmail=shop.userEmail
                    
                    var result = null
                    result = await CompileFbdFbmStock(sku)
                    sku.FBMstock = result.FBMstock
                    sku.FBDstock = result.FBDstock
                    sku.updatedAt = moment().toDate();
                    sku.itemId=product.item_id;

                skuResult = await darazSku.updateOne(
                    {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:sku},
                    {upsert:true}
                )
                if(skuResult.upserted && skuResult.upserted.length>0){
                    upsertedSkuIds = skuResult.upserted.map(result=>result._id)
                }
                }
                await darazProduct.updateOne(
                    {ItemId:product.item_id,ShopShortCode:shop.shortCode,userEmail:shop.userEmail},
                    {$set:createProductObj(product,upsertedSkuIds)},
                    {upsert:true}
                )
            }
        }
}
console.log("New Skus Fetched")
}

async function CompileFbdFbmStock(sku){
    var FBMstock={occupyQuantity: 0,quantity: 0,totalQuantity: 0,withholdQuantity: 0,sellableQuantity: 0}
    var FBDstock={occupyQuantity: 0,quantity: 0,totalQuantity: 0,withholdQuantity: 0,sellableQuantity: 0}
    try{
       for(fblStock of sku.fblWarehouseInventories){
            for(stockType in FBDstock){
                FBDstock[stockType] = fblStock[stockType] !=null ? FBDstock[stockType]+fblStock[stockType]:0;
            }
       }
       for(mwStock of sku.multiWarehouseInventories){
            for(stockType in FBMstock){
                FBMstock[stockType] = mwStock[stockType] !=null ? FBMstock[stockType]+mwStock[stockType]:0;
            }
        }
    }catch(ex){
        console.log("Exception occured in InventoryStringToJSon "+ex);
    }

    return {FBMstock:FBMstock,FBDstock:FBDstock}
}

module.exports.getSkus = getSkus
module.exports.getAllSkus=getAllSkus
module.exports.updateAllSkus=updateAllSkus