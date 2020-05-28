const express = require("express");

const router = express.Router();

router.get("/",(req,res)=>{
    res.status(200);
    res.render("login");
});

router.get("/register",(req,res)=>{
    res.render("register");
});


router.get("/changePassword",(req,res)=>{
    res.render("changePassword");
});

router.get("/login",(req,res)=>{
    res.render("login");
});

router.get("/updateprofile/:id",(req,res)=>{
    console.log(req.params.id);
    
    return res.render("updateprofile",{
        id:req.params.id
    });
});


router.get("/logout",(req,res)=>{
    console.log('Hi'+req.session.user);
    req.session.destroy(err=>{
       if(err){
           return res.redirect('/home');
       }
       res.clearCookie('cookie');
       res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
       res.redirect('/'); 
    })
    // console.log(req.session.user);
});

module.exports = router;