const { Plan } = require("../models/plan");
const { plansData } = require("./data");

function executeAllDataQueries(){
    insertPlanData()
}

async function insertPlanData(){
    var plansCount = await Plan.find().count()
    if(plansCount==0){
        Plan.insertMany(plansData)
    }
}

module.exports.dataQueries = executeAllDataQueries;
