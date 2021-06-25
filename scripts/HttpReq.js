const axios = require('axios');

async function GetData(url){
        
    try{
        const response = await axios.get(url);
        // const data = response.data.SuccessResponse.Body.Orders;
        const data = response.data.SuccessResponse.Body;
        // console.log(response);

        return data
        
    }
    catch(error){
        console.log(error);
    }
}

module.exports.GetData = GetData