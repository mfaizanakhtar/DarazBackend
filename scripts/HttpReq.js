const axios = require('axios');

async function GetData(url){
        
    try{
        const response = await axios.get(url);
        // const data = response.data.SuccessResponse.Body.Orders;
        if(response.status==200 || response.status==201){
        var resp = response.data;
        if(resp.data){
            return resp.data
        }
        return resp
        }
        else return null
        
    }
    catch(error){
        console.log(error);
        return null
    }
}

async function PostData(url){
        
    try{
        const response = await axios.post(url);
        // const data = response.data.SuccessResponse.Body.Orders;
        if(response.status==200 || response.status==201){
        var resp = response.data;
        if(resp.data){
            return resp.data
        }
        return resp
        }
        else return null
        
    }
    catch(error){
        console.log(error);
        return null
    }
}

module.exports.GetData = GetData
module.exports.PostData = PostData