const { FILTERCONST } = require("../data/constants");
const { CustomOrderStatus } = require("../models/customOrderStatus");
const moment = require('moment');

async function createCustomOrderStatus(customStatusReq,userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
            let customStatus;
            let isMarkable=false;
            let hasDateRange=false
            customStatus = await CustomOrderStatus.findOne({statusName:customStatusReq.orderStatusName})
            if(!customStatusReq.isEdit && customStatus){
                reject({notUnique:true})
                return
            }
            let baseQueryAnd=[];
            let baseQueryOr=[];
            let seperateByFilter={}
            if(customStatusReq.statusArray){
                for(statuses of customStatusReq.statusArray){
                    if(!seperateByFilter[statuses.filterName]){
                        seperateByFilter[statuses.filterName]=[statuses]
                    }else{
                        seperateByFilter[statuses.filterName].push(statuses);
                    }
                }
                for(seperatedStatus in seperateByFilter){
                    if(seperatedStatus==FILTERCONST.ORDER_STATUS.value){
                        let query = createOrderStatusQuery(seperateByFilter[seperatedStatus])
                        if(query.and?.length>0) baseQueryAnd=[...baseQueryAnd,...query.and]
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }else if(seperatedStatus==FILTERCONST.CUSTOM_ORDER_STATUS.value){
                        let query = createWarehouseOrderStatusQuery(seperateByFilter[seperatedStatus],customStatusReq.orderStatusName)
                        isMarkable=query.isMarkable;
                        if(query.and?.length>0) baseQueryAnd=[...baseQueryAnd,...query.and]
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }else if(seperatedStatus==FILTERCONST.DATE_RANGE_FILTER.value){
                        let query = createDateRangequery(seperateByFilter[seperatedStatus])
                        hasDateRange=true
                        if(query.and?.length>0) baseQueryAnd=[...baseQueryAnd,...query.and]
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }else if(seperatedStatus==FILTERCONST.ORDER_PAYOUT_FILTER.value){
                        let query = createOrderPayoutQuery(seperateByFilter[seperatedStatus])
                        if(query.and?.length>0) baseQueryAnd=[...baseQueryAnd,...query.and]
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }
                }
            }
            let finalQuery={$or:[]};
            if(baseQueryOr.length>0) finalQuery["$or"]=[...finalQuery["$or"],...baseQueryOr]
            if(baseQueryAnd.length>0) finalQuery["$or"].push({$and:baseQueryAnd})
            // else finalQuery={$or:[{$and:baseQueryAnd}]}
            let finalStringifyQuery = JSON.stringify(finalQuery);
            if(customStatus){
                customStatus.statusArray=customStatusReq.statusArray;
                customStatus.statusMongoQuery=finalStringifyQuery
                customStatus.isMarkable=isMarkable
                customStatus.hasDateRange=hasDateRange
            }else{
                customStatus = new CustomOrderStatus({
                    statusName:customStatusReq.orderStatusName,
                    statusArray:customStatusReq.statusArray,
                    statusMongoQuery:finalStringifyQuery,
                    isMarkable:isMarkable,
                    hasDateRange:hasDateRange,
                    userEmail:userEmail
                })
            }
            let createdCustomStatus = await customStatus.save()
            let formattedCustomStatus = {statusName:createdCustomStatus.statusName,_id:createdCustomStatus._id,
                isMarkable:createdCustomStatus.isMarkable,hasDateRange:hasDateRange,statusArray:createdCustomStatus.statusArray}
            resolve({message:"Custom Status Created/Updated Successfully",createdCustomStatus:formattedCustomStatus})
        }catch(ex){
            reject(ex.message)
        }
    })
   

}

function getCustomStatuses(userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
            let allCustomStatusesOfUser = await CustomOrderStatus.find({$or:[{userEmail:userEmail},{userEmail:"all"}]},{statusName:1,statusArray:1,isMarkable:1,hasDateRange:1})
            resolve(allCustomStatusesOfUser);
        }catch(ex){
            reject(ex.message)
        }
    })
}

function deleteCustomStatus(userEmail,statusName){
    return new Promise(async(resolve,reject)=>{
        try{
            let toDeleteCustomStatus = await CustomOrderStatus.deleteOne({userEmail:userEmail,statusName:statusName})
            resolve(toDeleteCustomStatus);
        }catch(ex){
            reject(ex.message)
        }
    })
}

function createOrderStatusQuery(orderStatuses){
    let AndOrderStatusesQuery = []
    let NOTAndOrderStatusesQuery=[]
    let OrOrderStatusesQuery = []
    for(orderStatus of orderStatuses){
        if(orderStatus?.isNot===true){
            if(orderStatus.filterType=='AND'){
                NOTAndOrderStatusesQuery.push({"$not":{"$in":[orderStatus.value,"$OrderItems.Status"]}})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"$not":{"$in":[orderStatus.value,"$OrderItems.Status"]}})
            }
        }else{
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"$in":[orderStatus.value,"$OrderItems.Status"]})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"$in":[orderStatus.value,"$OrderItems.Status"]})
            }
        }
    }
    let mongoQuery={}
    if(OrOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,or:OrOrderStatusesQuery}
    if(AndOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,and:[{$or:AndOrderStatusesQuery}]}
    if(NOTAndOrderStatusesQuery.length>0){
        if(mongoQuery.and) mongoQuery.and.push({$and:NOTAndOrderStatusesQuery}) 
        else mongoQuery.and=[{$and:NOTAndOrderStatusesQuery}]
    }
    return mongoQuery;
}

function createWarehouseOrderStatusQuery(orderStatuses,statusName){
    let AndOrderStatusesQuery = []
    let NOTAndOrderStatusesQuery=[]
    let OrOrderStatusesQuery = []
    let isMarkable=false;
    for(orderStatus of orderStatuses){
        if(orderStatus.value==statusName) isMarkable=true;
        if(orderStatus?.isNot===true){
            if(orderStatus.filterType=='AND'){
                NOTAndOrderStatusesQuery.push({"$not":{"$in":[orderStatus.value,"$OrderItems.WarehouseStatus"]}})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"$not":{"$in":[orderStatus.value,"$OrderItems.WarehouseStatus"]}})
            }
        }else{
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"$in":[orderStatus.value,"$OrderItems.WarehouseStatus"]})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"$in":[orderStatus.value,"$OrderItems.WarehouseStatus"]})
            }
        }
    }
    let mongoQuery={isMarkable:isMarkable}
    if(OrOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,or:OrOrderStatusesQuery}
    if(AndOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,and:[{$or:AndOrderStatusesQuery}]}
    if(NOTAndOrderStatusesQuery.length>0){
        if(mongoQuery.and) mongoQuery.and.push({$and:NOTAndOrderStatusesQuery}) 
        else mongoQuery.and=[{$and:NOTAndOrderStatusesQuery}]
    }
    return mongoQuery;
}

function createDateRangequery(dateFilters){
    let AndDateRangeQuery = []
    let OrDateRangeQuery = []

    for(dateFilter of dateFilters){
        let greaterThanDate
        let lesserThanDate
        if( dateFilter.value?.greaterThan && dateFilter.value?.lesserThan){
            greaterThanDate = parseInt(dateFilter.value.greaterThan)
            lesserThanDate = parseInt(dateFilter.value.lesserThan)
            if(dateFilter.filterType=='AND'){
                AndDateRangeQuery.push({$and:[{$gte:['$CreatedAt',{$dateSubtract:{startDate:'$$NOW',unit:'day',amount:greaterThanDate}}]},
                {$lte:['$CreatedAt',{$dateSubtract:{startDate:'$$NOW',unit:'day',amount:lesserThanDate}}]}]})
            }else if(dateFilter.filterType=='OR'){
                OrDateRangeQuery.push({$and:[{$gte:['$CreatedAt',{$dateSubtract:{startDate:'$$NOW',unit:'day',amount:greaterThanDate}}]},
                {$lte:['$CreatedAt',{$dateSubtract:{startDate:'$$NOW',unit:'day',amount:lesserThanDate}}]}]})
            }
        }
    }
    let mongoQuery={}
    if(OrDateRangeQuery.length>0) mongoQuery={...mongoQuery,or:OrDateRangeQuery}
    if(AndDateRangeQuery.length>0) mongoQuery={...mongoQuery,and:[{$or:AndDateRangeQuery}]}
    return mongoQuery;
}

function createOrderPayoutQuery(orderPayoutFilters){
    let AndOrderPayoutQuery = []
    let OrOrderPayoutQuery = []

    for(orderPayoutFilter of orderPayoutFilters){
        if(orderPayoutFilter.value?.type && orderPayoutFilter.value?.val){
            let value = parseInt(orderPayoutFilter.value?.val)
            let type = orderPayoutFilter.value?.type
            let query=null
            if(type=='\>\='){
                query={$gte:['$maxPayout',value]}
            }else if(type=='\<\='){
                query={$lte:['$minPayout',value]}
            }else if(type=='\='){
                query={$in:[value,'$OrderItems.TransactionPayout']}
            }
            if(query){
                if(orderPayoutFilter.filterType=='AND'){
                    AndOrderPayoutQuery.push(query)
                }else if(orderPayoutFilter.filterType=='OR'){
                    OrOrderPayoutQuery.push(query)
                }
            }
        }
    }
    let mongoQuery={}
    if(OrOrderPayoutQuery.length>0) mongoQuery={...mongoQuery,or:OrOrderPayoutQuery}
    if(AndOrderPayoutQuery.length>0) mongoQuery={...mongoQuery,and:[{$or:AndOrderPayoutQuery}]}
    return mongoQuery;
}

module.exports.createCustomOrderStatus = createCustomOrderStatus;
module.exports.getCustomStatuses = getCustomStatuses;
module.exports.deleteCustomStatus = deleteCustomStatus;