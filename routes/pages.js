const express = require("express");
const model = require("../models")
const router = express.Router();
var StatsD = require('node-statsd'),
      client = new StatsD();
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './log/application.log',
    }]
});
const AWS = require("aws-sdk");

router.get("/",(req,res)=>{
    var start = new Date().getTime();
    log.info('homeroute');
    res.status(200);
    res.render("login");
    var end = new Date().getTime();
    client.timing("homeroute.GETRequest",end-start);
});

router.get("/register",(req,res)=>{
    var start = new Date().getTime();
    log.info('registrationroute');
    res.render("register");
    var end = new Date().getTime();
    client.timing("homeroute.RegisterGETRequest",end-start);
});


router.get("/changePassword",(req,res)=>{
    let user = req.session.user;
    if(user){
        res.render("changePassword");
    }else{
        res.redirect('/'); 
    }
});

router.get("/login",(req,res)=>{
    log.info('loginroute');
    res.render("login");
});

router.get("/updateprofile/:id",async(req,res)=>{
    var start = new Date().getTime();
    log.info("userid "+req.params.id);
    
    let user = await model.User.findOne({
        where: { id:req.params.id},
      });
      if (user) {
        var end = new Date().getTime();
        client.timing("homeroute.updateProfileGETRequest",end-start);
        return res.render("updateprofile", {
          upuser: user
        });
      }
      
});


router.get("/logout",(req,res)=>{
    var start = new Date().getTime();
    log.info("Session user before logout "+req.session.user);
    req.session.destroy(err=>{
       if(err){
           return res.redirect('/home');
       }
       res.clearCookie('cookie');
       res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
       res.redirect('/'); 
    })
    var end = new Date().getTime();
    client.timing("homeroute.logoutGETRequest",end-start);
});

router.get("/forgetPassword",(req,res)=>{
    log.info('forgetpassword get route');
    res.render("forgetPassword");
});
AWS.config.update({ region: "us-east-1" });
router.post("/forgetPassword",async(req,res)=>{
    log.info('forgetpassword Post route');
    const params = {
        Message: JSON.stringify({ email: req.body.email }),
        TopicArn: "arn:aws:sns:us-east-1:934555267499:password_reset",
      };
    let user = await model.User.findOne({
        where: { email: req.body.email },
      });
      if (!user) {
        return res.status(401).render("forgetPassword", {
          message: "Please use registered Email Address!",
        });
      }

    
      const sns = new AWS.SNS({ apiVersion: "2010-03-31" })
        .publish(params)
        .promise();
  
      sns
        .then(function (data) {
          logger.info(
            `Message ${params.Message} send sent to the topic ${params.TopicArn}`
          );
          logger.info("MessageID is " + data.MessageId);
          return res.render("forgotpassword", {
            message: "Email sent successfully!",
          });
        })
        .catch(function (err) {
          logger.info(err, err.stack);
          return res.render("forgotpassword", {
            message: "Error, check logs!",
          });
        });
});


module.exports = router;