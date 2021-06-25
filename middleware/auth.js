const jwt = require("jsonwebtoken")
const config = require("config")

function auth(req,res,next){
    const token = req.header("auth-token")
    console.log(token);
    if(!token) return res.status(401).send("Access denied. No token provided")

    try{
    const decoded = jwt.decode(token,config.get("jwtprivatekey"));
    req.user = decoded
    next();
    }
    catch{
        res.status(400).send("Invalid Token")
    }
}

module.exports = auth