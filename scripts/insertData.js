const { Lookup } = require("../models/lookup");
const { Plan } = require("../models/plan");
const { plansData, bankData, permissions, plansPermissions, mailerCredential } = require("./data");

function executeAllDataQueries(){
    insertPlanData()
    insertLookup("bankDetails",bankData)
    insertLookup("permissions",permissions)
    insertLookup("Starter",plansPermissions.Starter)
    insertLookup("Professional",plansPermissions.Professional)
    insertLookup("ProfessionalPlus",plansPermissions.ProfessionalPlus)
    insertLookup("Enterprise",plansPermissions.Enterprise)
    insertLookup("mailerCredential",mailerCredential)
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

module.exports.dataQueries = executeAllDataQueries;
