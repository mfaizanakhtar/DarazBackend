const { Lookup } = require("../models/lookup");
const { Plan } = require("../models/plan");
const { plansData, bankData } = require("./data");

function executeAllDataQueries(){
    insertPlanData()
    insertLookup("bankDetails",bankData)
}

async function insertPlanData(){
    var plansCount = await Plan.find().count()
    if(plansCount==0){
        Plan.insertMany(plansData)
    }
}

async function insertLookup(lookup_key,lookup_detail){
    var lookupExists = await Lookup.find({lookup_key:lookup_key}).count() == 0 ? false : true
    if(!lookupExists){
        
        var lookup = new Lookup({
            lookup_key:lookup_key,
            lookup_detail:lookup_detail
        })
    
        await lookup.save()
    }

}

module.exports.dataQueries = executeAllDataQueries;
