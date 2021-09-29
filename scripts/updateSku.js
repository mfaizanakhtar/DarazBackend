const {GetData} = require('./HttpReq')
const {generateSkuUrl} = require('./GenerateUrl')
const {Darazid} = require('../models/darazid')
const {darazProduct} = require('../models/darazproduct')
const {darazSku} = require('../models/darazsku')
const {Sku} = require('../models/sku')
const {updateOrderItemStatus} = require('../scripts/updateStatus')

async function getSkus(darazid,update,skus){
    // console.log(skus.length)
    // console.log("darazid: "+darazid+" skus: "+skus+" update: "+update)
    shop = await Darazid.findOne({shopid:darazid})
    var Url
    if(skus!=undefined){
        Url = generateSkuUrl(shop.shopid,shop.secretkey,'['+skus.toString()+']')
    }
    else if(skus==undefined){
        Url = generateSkuUrl(shop.shopid,shop.secretkey)
    }
    
    // console.log(Url)
    var ProductSku = await GetData(Url)
    var Products = ProductSku.Products
    for(product of Products){
        var skuIdArray=[]
        for(const [i,sku] of product.Skus.entries()){
            
            sku.ShopId=shop.shopid
            sku.useremail=shop.useremail
            
            // sku.FBMstock=0
            // sku.FBDstock=0
            var result = null
            result = await InventoryStringToJSon(sku)
            sku.multiWarehouseInventories = result.multiWarehouseInventories
            sku.fblWarehouseInventories = result.fblWarehouseInventories

            if(!update){
                var GroupSku = await Sku.findOne({useremail:shop.useremail,name:baseSku(sku.SellerSku)}) 

                if(GroupSku==null) GroupSku={cost:0,FBMpackagingCost:0,FBDpackagingCost:0}
                sku.FBMstock=result.multiWarehouseInventories
                sku.FBDstock=result.fblWarehouseInventories
                sku.localQuantity=sku.quantity
                sku.cost = GroupSku.cost
                sku.FBMpackagingCost=GroupSku.FBMpackagingCost
                sku.FBDpackagingCost=GroupSku.FBDpackagingCost
                sku.BaseSku=GroupSku.name
            }

            skuResult = await darazSku.updateMany(
                {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail},
                {$set:sku},
                {upsert:true}
            )
            if(skuResult.upserted!=undefined) skuIdArray.push(skuResult.upserted[0]._id)
        }
        
        product.Skus=skuIdArray
        product.ShopId=shop.shopid
        product.useremail=shop.useremail
        productResult = await darazProduct.updateMany({ItemId:product.ItemId,ShopId:product.ShopId,useremail:product.useremail},product,{upsert:true})

    }
}

async function InventoryStringToJSon(sku){
    var fblWarehouseInventories={
        occupyQuantity: 0,
        quantity: 0,
        totalQuantity: 0,
        withholdQuantity: 0,
        sellableQuantity: 0
      }

    var multiWarehouseInventories="{"
    var tempData = sku.multiWarehouseInventories[0].match(/[A-z]+\=[0-9]+/g)
    // console.log(tempData)
    for(var [i,data] of tempData.entries()){
        multiWarehouseInventories=multiWarehouseInventories+'"'+data.replace(/=/g,'":"')+'"'
        if(i!=tempData.length-1){
        multiWarehouseInventories=multiWarehouseInventories+','
        }
    }
    multiWarehouseInventories=multiWarehouseInventories+"}"
    multiWarehouseInventories=JSON.parse(multiWarehouseInventories)


    // console.log("FBL Length: "+sku.fblWarehouseInventories.length)
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

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

module.exports.getSkus = getSkus