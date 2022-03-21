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
        Name:"Professional Plus",
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
    DSCInventory:{value:false,label:"Returns/Dispatch"},
    GroupedInventory:{value:false,label:"DSC Inventory"},
    Profitibility:{value:false,label:"Grouped Inventory"},
    ReturnsDispatch:{value:false,label:"Profitibility"},
    Revenue:{value:false,label:"Revenue"},
    bypassSubAccVerification:{value:false,label:"Bypass Sub Account Verification",isSubAccount:false}
}

plansPermissions={
    Starter:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        DSCInventory:{value:true,label:"Returns/Dispatch"},
        GroupedInventory:{value:true,label:"DSC Inventory"},
        Profitibility:{value:true,label:"Grouped Inventory"},
        ReturnsDispatch:{value:true,label:"Profitibility"}
    },
    Professional:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        DSCInventory:{value:true,label:"Returns/Dispatch"},
        GroupedInventory:{value:true,label:"DSC Inventory"},
        Profitibility:{value:true,label:"Grouped Inventory"},
        ReturnsDispatch:{value:true,label:"Profitibility"}
    },
    ProfessionalPlus:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        DSCInventory:{value:true,label:"Returns/Dispatch"},
        GroupedInventory:{value:true,label:"DSC Inventory"},
        Profitibility:{value:true,label:"Grouped Inventory"},
        ReturnsDispatch:{value:true,label:"Profitibility"}
    },
    Enterprise:{
        Orders:{value:true,label:"Orders"},
        Finance:{value:true,label:"Finance"},
        DSCInventory:{value:true,label:"Returns/Dispatch"},
        GroupedInventory:{value:true,label:"DSC Inventory"},
        Profitibility:{value:true,label:"Grouped Inventory"},
        ReturnsDispatch:{value:true,label:"Profitibility"}
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