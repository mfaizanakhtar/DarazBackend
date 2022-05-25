const {GetData} = require('./HttpReq')
const {generateSkuUrl} = require('./GenerateUrl')
const {Darazid} = require('../models/darazid')
const {darazProduct} = require('../models/darazproduct')
const {darazSku} = require('../models/darazsku')
const {Sku} = require('../models/sku')
const {updateOrderItemStatus} = require('../scripts/updateStatus')

async function getSkus(darazid,skus){
    // console.log(skus.length)
    // console.log("darazid: "+darazid+" skus: "+skus+" update: "+update)
    try{
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
    if(ProductSku!=null){
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

        //     if(!update){
        //         var GroupSku = await Sku.findOne({useremail:shop.useremail,name:baseSku(sku.SellerSku)}) 

        //         if(GroupSku==null) GroupSku={cost:0,FBMpackagingCost:0,FBDpackagingCost:0}
        //         sku.FBMstock=result.multiWarehouseInventories
        //         sku.FBDstock=result.fblWarehouseInventories
        //         sku.localQuantity=sku.quantity
        //         sku.cost = GroupSku.cost
        //         sku.FBMpackagingCost=GroupSku.FBMpackagingCost
        //         sku.FBDpackagingCost=GroupSku.FBDpackagingCost
        //         sku.BaseSku=GroupSku.name


        //         // if(skuResult.upserted!=undefined) skuIdArray.push(skuResult.upserted[0]._id)

        //         // product.Skus=skuIdArray
        //         // product.ShopId=shop.shopid
        //         // product.useremail=shop.useremail
        //         // productResult = await darazProduct.updateMany({ItemId:product.ItemId,ShopId:product.ShopId,useremail:product.useremail},product,{upsert:true})
        //     }
        //     else if(update){
        //     skuResult = await darazSku.updateMany(
        //         {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail},
        //         {$set:sku}
        //     )
        //  }
         skuResult = await darazSku.updateMany(
            {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail},
            {$set:sku},
            {upsert:true}
        )
        }
        


    }
}
}catch(ex){
    console.log("Error in getSkus error: "+ex)
}
}

async function updateAllSkus(repeatTime){
    try{
    shops = await Darazid.find()
    for(var shop of shops){
        
        splitCount=30
        var skuitemscount = await darazSku.countDocuments({ShopId:shop.shopid})
        
        end = Math.ceil(skuitemscount/splitCount)
        
        for(let i=0;i<end;i++){
            var AllShopSkus = await darazSku.find({ShopId:shop.shopid})
            .skip(i*splitCount)
            .limit(splitCount)
            AllShopSkusUrl = await generateSkuUrl(shop.shopid,shop.secretkey,await generateSkuStrings(AllShopSkus))
            var ProductSku = await GetData(Url)
            if(ProductSku){
    
            
            var Products = ProductSku.Products
            for(product of Products){
                // var skuIdArray=[]
                for(const [i,sku] of product.Skus.entries()){
    
                        result = await InventoryStringToJSon(sku)
                        sku.multiWarehouseInventories = result.multiWarehouseInventories
                        sku.fblWarehouseInventories = result.fblWarehouseInventories
        
                        skuResult = await darazSku.updateMany(
                            {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail},
                            {...sku}
                        )
    
                }
            }
            }
        }
    }
}catch(ex){
    console.log("Exception occured at updateAllSkus, error: "+ex)
}
console.log("All Skus Updated")
if(repeatTime!=undefined){
    setTimeout(() => {
        updateAllSkus(repeatTime)
    }, repeatTime);
}
}

async function generateSkuStrings(AllSkus){
    SkuArray=[]
    for(sku of AllSkus){
        SkuArray.push('"'+sku.SellerSku+'"')
    }
    SkuString='['+SkuArray.toString()+']'
    return SkuString
}

async function getAllSkus(repeatTime){
    shops = await Darazid.find()
    for(var shop of shops){
        Url=generateSkuUrl(shop.shopid,shop.secretkey)
        var ProductSku = await GetData(Url)
        if(ProductSku){

        
        var Products = ProductSku.Products
        for(product of Products){
            // var skuIdArray=[]
            for(const [i,sku] of product.Skus.entries()){

                dSku = await darazSku.findOne({ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail})
                if(!dSku){
                    sku.ShopId=shop.shopid
                    sku.useremail=shop.useremail
                    result = await InventoryStringToJSon(sku)
                    sku.multiWarehouseInventories = result.multiWarehouseInventories
                    sku.fblWarehouseInventories = result.fblWarehouseInventories

                    var GroupSku = await Sku.findOne({useremail:shop.useremail,name:baseSku(sku.SellerSku)}) 

                    if(GroupSku==null) GroupSku={cost:0,FBMpackagingCost:0,FBDpackagingCost:0}
                    sku.FBMstock=result.multiWarehouseInventories
                    sku.FBDstock=result.fblWarehouseInventories
                    sku.localQuantity=sku.quantity
                    sku.cost = GroupSku.cost
                    sku.FBMpackagingCost=GroupSku.FBMpackagingCost
                    sku.FBDpackagingCost=GroupSku.FBDpackagingCost
                    sku.BaseSku=GroupSku.name
    
                    skuResult = await darazSku.updateMany(
                        {ShopSku:sku.ShopSku,SkuId:sku.SkuId,ShopId:shop.shopid,useremail:shop.useremail},
                        {$set:sku},
                        {upsert:true}
                    )
                    // if(skuResult.upserted!=undefined) skuIdArray.push(skuResult.upserted[0]._id)
                }

            }
    }
}
}
console.log("New Skus Fetched")
if(repeatTime!=undefined){
    setTimeout(() => {
        getAllSkus(repeatTime)
    }, repeatTime);
}
}

async function InventoryStringToJSon(sku){
    try{
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
    }catch(ex){
        console.log("Exception occured in InventoryStringToJSon "+ex);
    }

    return {multiWarehouseInventories:multiWarehouseInventories,fblWarehouseInventories:fblWarehouseInventories}
}

function baseSku(Sku){
    var seperator = Sku.indexOf("-");
    if(seperator<0) return Sku
    return Sku.substr(0,seperator)
}

module.exports.getSkus = getSkus
module.exports.getAllSkus=getAllSkus
module.exports.updateAllSkus=updateAllSkus