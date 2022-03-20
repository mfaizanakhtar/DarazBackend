const nodemailer = require('nodemailer');
const { Lookup } = require('../models/lookup');

async function sendVerificationEmail(verificationCode,userEmail){
    var {lookup_detail:mailCredential} = await Lookup.findOne({lookup_key:"mailerCredential"})
    var subject="Email Verification Code"
    var body = "Hello, Your Verification Code is "+verificationCode
    console.log(mailCredential)
    sendEmail(mailCredential,subject,body,userEmail)
}

async function sendInvitationVerification(userEmail,verificationLink,invitedBy){
    var {lookup_detail:mailCredential} = await Lookup.findOne({lookup_key:"mailerCredential"})
    var subject="Invitation Link"
    var body = "Hello, You have been invited to manage account by "+invitedBy+". Please click on the link to accept invite. "+verificationLink
    console.log(mailCredential)
    sendEmail(mailCredential,subject,body,userEmail)
}

async function sendResetEmail(userEmail,resetLink){
    var {lookup_detail:mailCredential} = await Lookup.findOne({lookup_key:"mailerCredential"})
    var subject="Email Reset Link"
    var body = "Hello, Your Reset Link is "+resetLink
    console.log(mailCredential)
    sendEmail(mailCredential,subject,body,userEmail)
}

function sendEmail(credential,subject,body,recipent){

    var smtpTransport = nodemailer.createTransport({
        host: credential.host,
        port:credential.port,
        secure:true,
        auth: {
            user: credential.mailUserName,
            pass: credential.mailPassword
        }
    })

    var mailOptions = {
        to:recipent,
        from:credential.mailUserName,
        subject:subject,
        html:body
    }

    smtpTransport.sendMail(mailOptions,(err,res)=>{
        if(err){
            console.log(err)
        }else{
            console.log("sent")
        }
    })
}

module.exports.sendVerificationEmail = sendVerificationEmail
module.exports.sendResetEmail = sendResetEmail