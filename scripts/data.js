plansData  = [
    {
        Name:"Basic",
        Pricing:1000,
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-edit-box-line"
    },
    {
        Name:"Professional",
        Pricing:2000,
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-medal-line "
    },
    {
        Name:"ProfessionalPlus",
        Pricing:5000,
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-stack-line"
    },
    {
        Name:"Enterprise",
        Pricing:20000,
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
    bypassSubAccVerification:{value:false,label:"Bypass Sub Account Verification",isSubAccount:false},
    baseSkuStockChecklist:{value:false,label:"Base Sku Stock Checklist",isSubAccount:false}
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
    host:"alogy.pk",
    port:465,
    mailUserName:"no-reply@alogy.pk",
    mailPassword:"noreply123"
}

module.exports.plansData = plansData;
module.exports.bankData = bankData;
module.exports.permissions = permissions;
module.exports.plansPermissions = plansPermissions;
module.exports.mailerCredential=mailerCredential;