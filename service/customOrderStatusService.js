const { FILTERCONST } = require("../data/constants");
const { CustomOrderStatus } = require("../models/customOrderStatus");

async function createCustomOrderStatus(customStatusReq,userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
            let isMarkable=false;
            if(!customStatusReq.isEdit){
                let findStatus = await CustomOrderStatus.findOne({statusName:customStatusReq.orderStatusName})
                if(findStatus){
                    reject({notUnique:true})
                    return
                } 
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
                        if(query.and) baseQueryAnd.push(query.and)
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }else if(seperatedStatus==FILTERCONST.CUSTOM_ORDER_STATUS.value){
                        let query = createWarehouseOrderStatusQuery(seperateByFilter[seperatedStatus],customStatusReq.orderStatusName)
                        isMarkable=query.isMarkable;
                        if(query.and) baseQueryAnd.push(query.and)
                        if(query.or?.length>0) baseQueryOr=[...baseQueryOr,...query.or]
                    }
                }
            }
            let finalQuery={$or:[]};
            if(baseQueryOr.length>0) finalQuery["$or"]=[...finalQuery["$or"],...baseQueryOr]
            if(baseQueryAnd.length>0) finalQuery["$or"].push({$and:baseQueryAnd})
            // else finalQuery={$or:[{$and:baseQueryAnd}]}
            let finalStringifyQuery = JSON.stringify(finalQuery);
            let customStatus = new CustomOrderStatus({
                statusName:customStatusReq.orderStatusName,
                statusArray:customStatusReq.statusArray,
                statusMongoQuery:finalStringifyQuery,
                isMarkable:isMarkable,
                userEmail:userEmail
            })
            let createdCustomStatus = await customStatus.save()
            let formattedCustomStatus = {statusName:createdCustomStatus.statusName,_id:createdCustomStatus._id,
                isMarkable:createdCustomStatus.isMarkable,statusArray:createdCustomStatus.statusArray}
            resolve({message:"Custom Status Created Successfully",createdCustomStatus:formattedCustomStatus})
        }catch(ex){
            reject(ex.message)
        }
    })
   

}

function getCustomStatuses(userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
            let allCustomStatusesOfUser = await CustomOrderStatus.find({$or:[{userEmail:userEmail},{userEmail:"all"}]},{statusName:1,statusArray:1,isMarkable:1})
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
    let OrOrderStatusesQuery = []
    for(orderStatus of orderStatuses){
        if(orderStatus?.isNot===true){
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"OrderItems.Status":{$ne:orderStatus.value}})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"OrderItems.Status":{$ne:orderStatus.value}})
            }
        }else{
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"OrderItems.Status":orderStatus.value})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"OrderItems.Status":orderStatus.value})
            }
        }
    }
    let mongoQuery={}
    if(OrOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,or:OrOrderStatusesQuery}
    if(AndOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,and:{$or:AndOrderStatusesQuery}}
    return mongoQuery;
}

function createWarehouseOrderStatusQuery(orderStatuses,statusName){
    let AndOrderStatusesQuery = []
    let OrOrderStatusesQuery = []
    let isMarkable=false;
    for(orderStatus of orderStatuses){
        if(orderStatus.value==statusName) isMarkable=true;
        if(orderStatus?.isNot===true){
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"OrderItems.WarehouseStatus":{$ne:orderStatus.value}})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"OrderItems.WarehouseStatus":{$ne:orderStatus.value}})
            }
        }else{
            if(orderStatus.filterType=='AND'){
                AndOrderStatusesQuery.push({"OrderItems.WarehouseStatus":orderStatus.value})
            }else if(orderStatus.filterType=='OR'){
                OrOrderStatusesQuery.push({"OrderItems.WarehouseStatus":orderStatus.value})
            }
        }
    }
    let mongoQuery={isMarkable:isMarkable}
    if(OrOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,or:OrOrderStatusesQuery}
    if(AndOrderStatusesQuery.length>0) mongoQuery={...mongoQuery,and:{$or:AndOrderStatusesQuery}}
    return mongoQuery;
}

module.exports.createCustomOrderStatus = createCustomOrderStatus;
module.exports.getCustomStatuses = getCustomStatuses;
module.exports.deleteCustomStatus = deleteCustomStatus;