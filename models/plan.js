const mongoose = require('mongoose');

const plansSchema = new mongoose.Schema({
    Name:String,
    Pricing:Number,
    DiscountPercent:Object,
    Description:[String],
    icon:String
})

const Plan = new mongoose.model('plans',plansSchema);

module.exports.Plan = Plan;