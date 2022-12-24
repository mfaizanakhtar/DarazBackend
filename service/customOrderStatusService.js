const { FILTERCONST } = require("../data/constants");
const { CustomOrderStatus } = require("../models/customOrderStatus");

async function createCustomOrderStatus(customStatusReq,userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
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
                        baseQueryAnd.push(query.and)
                        baseQueryOr.push(...query.or)
                    }
                }
            }
            let finalQuery;
            if(baseQueryOr.length>0) finalQuery={$or:[{$and:baseQueryAnd},{...baseQueryOr}]}
            else finalQuery={$or:[{$and:baseQueryAnd}]}
            let finalStringifyQuery = JSON.stringify(finalQuery);
            let customStatus = new CustomOrderStatus({
                statusName:customStatusReq.orderStatusName,
                statusArray:customStatusReq.statusArray,
                statusMongoQuery:finalStringifyQuery,
                userEmail:userEmail
            })
            let createdCustomStatus = await customStatus.save()
            let formattedCustomStatus = {statusName:createdCustomStatus.statusName,_id:createdCustomStatus._id}
            resolve({message:"Custom Status Created Successfully",createdCustomStatus:formattedCustomStatus})
        }catch(ex){
            reject(ex.message)
        }
    })
   

}

function getCustomStatuses(userEmail){
    return new Promise(async(resolve,reject)=>{
        try{
            let allCustomStatusesOfUser = await CustomOrderStatus.find({userEmail:userEmail},{statusName:1,"statusArray.filterType":1,"statusArray.value":1})
            resolve(allCustomStatusesOfUser);
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
    let mongoQuery = {and:{$or:AndOrderStatusesQuery},or:OrOrderStatusesQuery};
    return mongoQuery;
}

function createWarehouseOrderStatusQuery(orderStatuses){
    let orderStatusesQuery = []
    for(orderStatus of orderStatuses){
        if(orderStatus?.isNot===true){
            orderStatusesQuery.push({"OrderItems.WarehouseStatus":{$ne:orderStatus.value}})
        }else{
            orderStatusesQuery.push({"OrderItems.WarehouseStatus":orderStatus.value})
        }
    }
    let mongoQuery = {$or:orderStatusesQuery};
    return mongoQuery;
}

module.exports.createCustomOrderStatus = createCustomOrderStatus;
module.exports.getCustomStatuses = getCustomStatuses;