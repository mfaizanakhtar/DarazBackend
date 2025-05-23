const config = require('config');
const { FILTERCONST } = require('./constants');

plansData  = [
    {
        Name:"Starter",
        Pricing:1000,
        DiscountPercent:{"1":0.9,"3":0.8,"6":0.7,"12":0.5},
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-edit-box-line"
    },
    {
        Name:"Professional",
        Pricing:2000,
        DiscountPercent:{"1":0.9,"3":0.8,"6":0.7,"12":0.5},
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-medal-line "
    },
    {
        Name:"ProfessionalPlus",
        Pricing:5000,
        DiscountPercent:{"1":0.9,"3":0.8,"6":0.7,"12":0.5},
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-stack-line"
    },
    {
        Name:"Enterprise",
        Pricing:20000,
        DiscountPercent:{"1":0.9,"3":0.8,"6":0.7,"12":0.5},
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-vip-crown-line"
    }
]

bankData={
    bankName:"Meezan Bank",
    bankTitle:"Faizan Akhter",
    bankAccount:"0102409866"
}

permissions={
    Orders:{value:false,label:"Orders"},
    Finance:{value:false,label:"Finance"},
    SalesAnalytics:{value:false,label:"Sales Analytics"},
    Revenue:{value:false,label:"Revenue"},
    DSCInventory:{value:false,label:"DSC Inventory"},
    DSCInventoryCost:{value:false,label:"DSC Product Cost"},
    GroupedInventory:{value:false,label:"Grouped Inventory"},
    Profitibility:{value:false,label:"Profitibility"},
    ReturnsDispatch:{value:false,label:"Returns/Dispatch"},
    customSellerAddress:{value:false,label:"Custom Seller Address"},
    bypassSubAccVerification:{value:false,label:"Bypass Sub Account Verification",isSubAccount:false},
    baseSkuStockChecklist:{value:false,label:"Base Sku Stock Checklist"}
}

plansPermissions={
    Starter:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        SalesAnalytics:{value:true,label:"Sales Analytics"},
        Revenue:{value:true,label:"Revenue"},
        DSCInventory:{value:true,label:"DSC Inventory"},
        DSCInventoryCost:{value:true,label:"DSC Product Cost"},
        GroupedInventory:{value:true,label:"Grouped Inventory"},
        Profitibility:{value:true,label:"Profitibility"},
        ReturnsDispatch:{value:true,label:"Returns/Dispatch"}
    },
    Professional:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        SalesAnalytics:{value:true,label:"Sales Analytics"},
        Revenue:{value:true,label:"Revenue"},
        DSCInventory:{value:true,label:"DSC Inventory"},
        DSCInventoryCost:{value:true,label:"DSC Product Cost"},
        GroupedInventory:{value:true,label:"Grouped Inventory"},
        Profitibility:{value:true,label:"Profitibility"},
        ReturnsDispatch:{value:true,label:"Returns/Dispatch"}
    },
    ProfessionalPlus:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        SalesAnalytics:{value:true,label:"Sales Analytics"},
        Revenue:{value:true,label:"Revenue"},
        DSCInventory:{value:true,label:"DSC Inventory"},
        DSCInventoryCost:{value:true,label:"DSC Product Cost"},
        GroupedInventory:{value:true,label:"Grouped Inventory"},
        Profitibility:{value:true,label:"Profitibility"},
        ReturnsDispatch:{value:true,label:"Returns/Dispatch"}
    },
    Enterprise:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        SalesAnalytics:{value:true,label:"Sales Analytics"},
        Revenue:{value:true,label:"Revenue"},
        DSCInventory:{value:true,label:"DSC Inventory"},
        DSCInventoryCost:{value:true,label:"DSC Product Cost"},
        GroupedInventory:{value:true,label:"Grouped Inventory"},
        Profitibility:{value:true,label:"Profitibility"},
        ReturnsDispatch:{value:true,label:"Returns/Dispatch"}
    }
}

mailerCredential={
    host:"mail.alogy.pk",
    port:465,
    mailUserName:"no-reply@alogy.pk",
    mailPassword:"noreply123"
}

darazOpenAppDetails={
    callBackUrl:config.get('baseUrl')+"/users/shops",
    appKey:"502538",
    pkUrl:"https://api.daraz.pk/oauth/authorize",
    appSecret:"oeXzbRisHKkx9OuVLqibtyicy4ev0BEp"
}

customDispatchedReceivedStatus=[{
    isMarkable:true,
    statusName:'Dispatched',
    statusMongoQuery:'{"$or":[{"$and":[{"$or":[{"$in":["Dispatched","$OrderItems.WarehouseStatus"]}]}]}]}',
    userEmail:'all'
},
{
    isMarkable:true,
    statusName:'Received',
    statusMongoQuery:'{"$or":[{"$and":[{"$or":[{"$in":["Received","$OrderItems.WarehouseStatus"]}]}]}]}',
    userEmail:'all'
}]

customOrderFilterTypes=["AND","OR"]

updateOrdersStatuses={orderStatuses:["pending","ready_to_ship","shipped"]}


customOrderFilters=[FILTERCONST.ORDER_STATUS,FILTERCONST.CUSTOM_ORDER_STATUS,FILTERCONST.DATE_RANGE_FILTER,FILTERCONST.ORDER_PAYOUT_FILTER]

module.exports.plansData = plansData;
module.exports.bankData = bankData;
module.exports.permissions = permissions;
module.exports.plansPermissions = plansPermissions;
module.exports.mailerCredential=mailerCredential;
module.exports.darazOpenAppDetails = darazOpenAppDetails;
module.exports.customOrderFilterTypes = customOrderFilterTypes;
module.exports.customOrderFilters = customOrderFilters;
module.exports.customDispatchedReceivedStatus=customDispatchedReceivedStatus;
module.exports.updateOrdersStatuses=updateOrdersStatuses;