const express = require('express');
const request = require('request')
const router = express.Router()

router.post('/',(req,res)=>{
    request({ url : req.body.url},
    (error,response, body)=>{
        if (error ) {
            return res.status(500).json({ type: 'error', message: err.message });
          }
          res.json(JSON.parse(body));
    })
    
})

module.exports=router;