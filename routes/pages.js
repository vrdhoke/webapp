const express = require("express");
const model = require("../models")
const router = express.Router();

var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './log/application.log',
    }]
});

router.get("/",(req,res)=>{
    log.info('homeroute');
    res.status(200);
    res.render("login");
});

router.get("/register",(req,res)=>{
    log.info('registrationroute');
    res.render("register");
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
    log.info("userid "+req.params.id);
    
    let user = await model.User.findOne({
        where: { id:req.params.id},
      });
      if (user) {
        return res.render("updateprofile", {
          upuser: user
        });
      }
});


router.get("/logout",(req,res)=>{
    log.info("Session user before logout "+req.session.user);
    req.session.destroy(err=>{
       if(err){
           return res.redirect('/home');
       }
       res.clearCookie('cookie');
       res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
       res.redirect('/'); 
    })
});

module.exports = router;