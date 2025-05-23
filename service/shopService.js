const { Shop } = require("../models/shop");
const { generateAccessTokenUrl, getSellerUrl,getRefreshAccessTokenUrl } = require("./GenerateUrl");
const { GetData, PostData } = require("../scripts/HttpReq");
const moment = require('moment');

async function authoriseAndAddShop(query,user){
    var url = generateAccessTokenUrl(query.code)
    console.log(url)
    var tokenResp = await GetData(url);
    var saveResult;
    var isUpdated=false;

    if(tokenResp.access_token){

        var getSellerUri = getSellerUrl(tokenResp.access_token)
        var sellerResp = await GetData(getSellerUri);
        if(sellerResp){
            var shop = await Shop.findOne({userEmail:{$ne:user.userEmail},shortCode:sellerResp.short_code})
            if(shop){
                throw {message:"This shop is already associated with different account. Please contact Administrator",status:400}
            }
            shop = await Shop.findOne({userEmail:user.userEmail,shortCode:sellerResp.short_code})
            if(shop){
                shop = updateExistingShop(shop,tokenResp,sellerResp)
                isUpdated=true;
            }else{
                shop = new Shop(getNewShopObj(tokenResp,sellerResp,user))
            }
            
            saveResult=await shop.save()
        }       
    }
    
    if(!saveResult){
        throw {message:"Invalid code",status:400}
    }
    return {isUpdated:isUpdated,shopName:sellerResp.name};
}

function getNewShopObj(tokenResp,sellerResp,user){
    var userObj = {
        userEmail:user.userEmail,
        accessToken:tokenResp.access_token,
        tokenExpiresIn:moment().add(tokenResp.expires_in,'seconds'),
        refreshToken:tokenResp.refresh_token,
        refreshExpiresIn:moment().add(tokenResp.refresh_expires_in,'seconds'),
        country:tokenResp.country,
        account:tokenResp.account,
        accountPlatform:tokenResp.account_platform,
        sellerId:tokenResp.user_info.seller_id,
        nameCompany:sellerResp.name_company,
        logoUrl:sellerResp.logo_url,
        verified:sellerResp.verified,
        name:sellerResp.name,
        location:sellerResp.location,
        email:sellerResp.email,
        status:sellerResp.status,
        shortCode:sellerResp.short_code,
    }
    return userObj
}

function updateExistingShop(shop,tokenResp,sellerResp){
    shop.accessToken = tokenResp.access_token;
    shop.tokenExpiresIn = moment().add(tokenResp.expires_in,'seconds');
    shop.refreshToken = tokenResp.refresh_token;
    shop.refreshExpiresIn = moment().add(tokenResp.refresh_expires_in,'seconds');
    shop.nameCompany = sellerResp.name_company;
    shop.logoUrl = sellerResp.logo_url;
    shop.location = sellerResp.location;
    shop.email = sellerResp.email;
    shop.status = sellerResp.status;

    return shop
}

async function getShopsWithUserEmail(userEmail){
    var shops = await Shop.find({userEmail:userEmail,appStatus:true},{shortCode:1,name:1}).sort({name:1})
    return shops
}

async function refreshAccessToken(){
    try{
        var shops = await Shop.find({appStatus:true});
        for(var shop of shops){
            var generateRefreshAccessUrl=getRefreshAccessTokenUrl(shop.refreshToken);
            var refreshTokenResp = await PostData(generateRefreshAccessUrl);
            if(refreshTokenResp.access_token){
                await Shop.updateOne({account:refreshTokenResp.account},
                    {access_token:refreshTokenResp.access_token,tokenExpiresIn:moment().add(refreshTokenResp.expires_in,'seconds'),
                refreshToken:refreshTokenResp.refresh_token,refreshExpiresIn:moment().add(refreshTokenResp.refresh_expires_in,'seconds')})
            }
        }
    }catch(ex){
        console.log("Exception in refreshing access token: "+ex.message)
    }
}

module.exports.authoriseAndAddShop = authoriseAndAddShop;
module.exports.getShopsWithUserEmail = getShopsWithUserEmail;
module.exports.refreshAccessToken = refreshAccessToken;