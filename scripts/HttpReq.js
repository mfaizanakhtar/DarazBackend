const axios = require('axios');

async function GetData(url){
        
    try{
        const response = await axios.get(url);
        // const data = response.data.SuccessResponse.Body.Orders;
        if(response.status==200 || response.status==201){
        const data = response.data;
        // console.log(response);

        return data
        }
        else return null
        
    }
    catch(error){
        console.log(error);
        return null
    }
}

module.exports.GetData = GetData