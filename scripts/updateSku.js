const {GetData} = require('./HttpReq')
const {generateSkuUrl} = require('./GenerateUrl')
const {Darazid} = require('../models/darazid')
const {darazProduct} = require('../models/darazproduct')
const {darazSku} = require('../models/darazsku')

async function getSkus(darazid,skus,update){
    console.log(skus.length)
    shop = await Darazid.findOne({shopid:darazid})
    Url = generateSkuUrl(shop.shopid,shop.secretkey,'['+skus.toString()+']')
    // console.log(Url)
    var ProductSku = await GetData(Url)
    var Products = ProductSku.Products
    for(product of Products){
        var skuIdArray=[]
        for(sku of product.Skus){
            
            sku.ShopId=shop.shopid
            sku.useremail=shop.useremail
            // sku.FBMstock=0
            // sku.FBDstock=0
            
            var result = InventoryStringToJSon(sku)
            sku.multiWarehouseInventories = result.multiWarehouseInventories
            sku.fblWarehouseInventories = result.fblWarehouseInventories

            if(!update){
                sku.FBMstock=result.multiWarehouseInventories
                sku.FBDstock=result.fblWarehouseInventories
            }

            skuResult = await darazSku.updateMany({SellerSku:sku.Sellersku,ShopSku:sku.ShopSku,SkuId:sku.SkuId,
                ShopId:shop.shopid,useremail:shop.useremail},sku,{upsert:true})
            if(skuResult.upserted.length>0) skuIdArray.push(skuResult.upserted[0]._id)
        }
        
        product.Skus=skuIdArray
        product.ShopId=shop.shopid
        product.useremail=shop.useremail
        productResult = await darazProduct.updateMany({ItemId:product.ItemId,ShopId:product.ShopId,useremail:product.useremail},product,{upsert:true})
        // console.log(productResult)
        // delete product.Skus
        // console.log(product)
    }
}

function InventoryStringToJSon(sku){
    var multiWarehouseInventories="{"
    var tempData = sku.multiWarehouseInventories[0].match(/[A-z]+\=[0-9]+/g)
    for(var [i,data] of tempData.entries()){
        multiWarehouseInventories=multiWarehouseInventories+'"'+data.replace(/=/g,'":"')+'"'
        if(i!=tempData.length-1){
        multiWarehouseInventories=multiWarehouseInventories+','
        }
    }
    multiWarehouseInventories=multiWarehouseInventories+"}"
    multiWarehouseInventories=JSON.parse(multiWarehouseInventories)

    var fblWarehouseInventories={
        occupyQuantity: 0,
        quantity: 0,
        totalQuantity: 0,
        withholdQuantity: 0,
        sellableQuantity: 0
      }

    if(sku.fblWarehouseInventories.length>0){
        for(var fbl of sku.fblWarehouseInventories){
            var tempData = fbl.match(/[A-z]+\=[0-9]+/g)
            var tempfblInventory="{"

            for(var [i,data] of tempData.entries()){
                tempfblInventory=tempfblInventory+'"'+data.replace(/=/g,'":"')+'"'
                if(i!=tempData.length-1){
                    tempfblInventory=tempfblInventory+','
                }
            }
            tempfblInventory=tempfblInventory+"}"
            tempfblInventory=JSON.parse(tempfblInventory)
            // console.log("before",tempfblInventory)
            for(var key in fblWarehouseInventories){
                fblWarehouseInventories[key]=fblWarehouseInventories[key]+parseInt(tempfblInventory[key])
            }
            

        }
        // console.log("after",fblWarehouseInventories)
    }

    return {multiWarehouseInventories:multiWarehouseInventories,fblWarehouseInventories:fblWarehouseInventories}
}

module.exports.getSkus = getSkus