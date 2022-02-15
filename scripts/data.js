plansData  = [
    {
        Name:"Starter",
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
        Name:"Enterprise",
        Pricing:5000,
        Description:["Free Live Support","Unlimited Tracking","Much More"],
        icon:"ri-stack-line"
    },
    {
        Name:"Unlimited",
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
    Orders:{value:true,label:"Orders"},
    Finance:{value:true,label:"Finance"},
    DSCInventory:{value:true,label:"Returns/Dispatch"},
    GroupedInventory:{value:true,label:"DSC Inventory"},
    Profitibility:{value:true,label:"Grouped Inventory"},
    ReturnsDispatch:{value:true,label:"Profitibility"},
}

module.exports.plansData = plansData;
module.exports.bankData = bankData;
module.exports.permissions = permissions;