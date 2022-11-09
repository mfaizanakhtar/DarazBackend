function updateQuery(query){
    var pageArgs={}
    var FinalFilter={}
    claimDate = new Date();
    claimDate.setDate(claimDate.getDate()-30);
    
    var AdditionStatus = getAdditionStatus(false)

    //removing datefilter if status = claimaible
    if(AdditionStatus[query["OrderItems.Status"]]){
        // if(query["OrderItems.Status"]=="Claimable" || query["OrderItems.Status"]=="ClaimFiled" || query["OrderItems.Status"]=="ClaimReceived") dateFilter={}
        //if status found from additionstatus, delete orderitems.status
        FinalFilter={...AdditionStatus[query["OrderItems.Status"]]}
        console.log(FinalFilter)
        query["OrderItems.Status"]="null"
    } 
    //iterate the query object
    for(var propName in query){//if value is null,startdate or enddate, delete the object key value
        if(query[propName] == "null" || propName=="startDate" || propName=="endDate" || propName=="skuSort" || propName=="shopSort" || propName=="Printed" || propName=="unPrinted") 
        delete query[propName]//if pagesize or page number, move to pageArgs object and delete that from query
        else if(propName=="pageSize" || propName=="pageNumber")
        {
            pageArgs={...pageArgs,[propName]:query[propName]}
            delete query[propName]
        }
        else if(propName=="OrderId" || propName=="OrderItems.TrackingCode"){
            const regex = new RegExp(query[propName])
            query[propName] = regex
        }
    }

    return({query:query,pageArgs:pageArgs,FinalFilter:FinalFilter})
}

function updateQueryForStockChecklist(query){
    var pageArgs={}
    var FinalFilter={}
    claimDate = new Date();
    claimDate.setDate(claimDate.getDate()-30);
    
    var AdditionStatus = getAdditionStatus(true)

    //removing datefilter if status = claimaible
    if(AdditionStatus[query["Status"]]){
        if(query["Status"]=="Claimable" || query["Status"]=="ClaimFiled" || query["Status"]=="ClaimReceived") dateFilter={}
        //if status found from additionstatus, delete orderitems.status
        FinalFilter={...AdditionStatus[query["Status"]]}
        console.log(FinalFilter)
        query["Status"]="null"
    } 
    //iterate the query object
    for(var propName in query){//if value is null,startdate or enddate, delete the object key value
        if(query[propName] == "null" || propName=="startDate" || propName=="endDate" || propName=="skuSort" || propName=="shopSort" || propName=="Printed" || propName=="unPrinted") 
        delete query[propName]//if pagesize or page number, move to pageArgs object and delete that from query
        else if(propName=="pageSize" || propName=="pageNumber")
        {
            pageArgs={...pageArgs,[propName]:query[propName]}
            delete query[propName]
        }
        else if(propName=="OrderId" || propName=="TrackingCode"){
            const regex = new RegExp(query[propName])
            query[propName] = regex
        }
    }

    return({query:query,pageArgs:pageArgs,FinalFilter:FinalFilter})
}

function getAdditionStatus(stockCheckList){
    
    var claimDate = new Date();
    claimDate.setDate(claimDate.getDate()-30);

    var AdditionStatus={}
    if(stockCheckList){
    AdditionStatus = {
        ready_to_ship:{"Status":"ready_to_ship","WarehouseStatus":{$ne:"Dispatched"}},
        RTSDispatched : {"Status":"ready_to_ship","DispatchDate":{$ne:null}},
        DeliveryFailedReceived : {"Status":"failed","WarehouseStatus":"Received"},
        Claimable : {CreatedAt: {$lte:claimDate},"WarehouseStatus":"Dispatched","Status":{$ne:"delivered"}},
        ClaimFiled : {$or:[{"WarehouseStatus":"Claim Filed"},{"WarehouseStatus":"Claim Approved"},{"WarehouseStatus":"Claim Rejected"},{"WarehouseStatus":"Claim POD Dispute"}]},
        ClaimReceived : {"WarehouseStatus":"Claim Received"}
    }
    }
    else {
        AdditionStatus = {
            ready_to_ship:{"OrderItems.Status":"ready_to_ship","OrderItems.WarehouseStatus":{$ne:"Dispatched"}},
            RTSDispatched : {"OrderItems.Status":"ready_to_ship","OrderItems.DispatchDate":{$ne:null}},
            DeliveryFailedReceived : {"OrderItems.Status":"failed","OrderItems.WarehouseStatus":"Received"},
            Claimable : {CreatedAt: {$lte:claimDate},"OrderItems.WarehouseStatus":"Dispatched","OrderItems.Status":{$ne:"delivered"}},
            ClaimFiled : {$or:[{"OrderItems.WarehouseStatus":"Claim Filed"},{"OrderItems.WarehouseStatus":"Claim Approved"},{"OrderItems.WarehouseStatus":"Claim Rejected"},{"OrderItems.WarehouseStatus":"Claim POD Dispute"}]},
            ClaimReceived : {"OrderItems.WarehouseStatus":"Claim Received"}
        } 
    }
    return  AdditionStatus
}


module.exports.getAdditionStatus=getAdditionStatus;
module.exports.updateQuery=updateQuery;
module.exports.updateQueryForStockChecklist=updateQueryForStockChecklist;

