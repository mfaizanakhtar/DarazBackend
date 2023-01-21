const { Lookup } = require("../models/lookup");
const { Plan } = require("../models/plan");
const { plansData, bankData, permissions, plansPermissions, mailerCredential, darazOpenAppDetails, customOrderFilterTypes, customOrderFilters, customDispatchedReceivedStatus } = require("../data/data");
const constants = require("../data/constants");
const { CustomOrderStatus } = require("../models/customOrderStatus");

function executeAllDataQueries(){
    insertPlanData()
    insertCustomStatuses()
    insertLookup("bankDetails",bankData)
    insertLookup("permissions",permissions)
    insertLookup("Starter",plansPermissions.Starter)
    insertLookup("Professional",plansPermissions.Professional)
    insertLookup("ProfessionalPlus",plansPermissions.ProfessionalPlus)
    insertLookup("Enterprise",plansPermissions.Enterprise)
    insertLookup(constants.TRIAL_PERMISSIONS_LOOKUP,plansPermissions.Enterprise)
    insertLookup("mailerCredential",mailerCredential)
    insertLookup("darazOpenAppDetails",darazOpenAppDetails)
    insertLookup("customOrderFilterTypes",customOrderFilterTypes);
    insertLookup("customOrderFilters",customOrderFilters);
}

async function insertPlanData(){
    var plansCount = await Plan.find().countDocuments()
    if(plansCount==0){
        Plan.insertMany(plansData)
    }
}

async function insertLookup(lookup_key,lookup_detail){
    var lookupExists = await Lookup.find({lookup_key:lookup_key}).countDocuments() == 0 ? false : true
    if(!lookupExists){
        
        var lookup = new Lookup({
            lookup_key:lookup_key,
            lookup_detail:lookup_detail
        })
    
        await lookup.save()
    }

}

async function insertCustomStatuses(){
    let customStatuses = customDispatchedReceivedStatus
    for(customStatus of customStatuses){
        let statusExists = await CustomOrderStatus.findOne({statusName:customStatus.statusName});
        if(!statusExists){
            let status = new CustomOrderStatus(customStatus);
            await status.save();
        }
    }
}

module.exports.dataQueries = executeAllDataQueries;
