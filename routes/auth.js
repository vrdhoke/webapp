const express = require("express");
const mysql = require("mysql");

const router = express.Router();
const bcrypt = require("bcryptjs");
var passwordValidator = require('password-validator');

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

const db = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'12345678',
    database:'CloudApp'
});


router.post('/register',(req,res)=>{
    console.log(req.body);
    
    const {fname ,lname,email,password} = req.body;

    db.query('SELECT email FROM User WHERE email = ?',[email],async(error,results)=>{
        if(error){
            console.log(error);
        }

        if(results.length > 0){
            return res.render("register",{
                message:"Email Address is Already in Use"
            });
        }else if(!schema.validate(password)){
            return res.render("register",{
                message:"Please enter strong password"
            });
        }
        let hashedPassword = await bcrypt.hash(password,8);

        console.log(hashedPassword);

        db.query('INSERT INTO User SET ?',{email:email,password :hashedPassword,firstname :fname, lastname:lname},(error,results)=>{
            if(error){
                console.log(error);
            }else {
                console.log(results.insertId);
                req.session.user = results.insertId
                
                res.status(201);
                res.render("register",{
                    message:"Registered Successfully"
                },function(err, html) {
                    console.log(html);
                    res.send("Registered Successfully");
                });
                
            }
        })
    })

});

router.get('/home',(req,res,next)=>{
    let userid = req.session.user;
    db.query('SELECT * FROM User WHERE id = ?',[userid],(err,result)=>{
        if(userid){
            res.render('home',{ message:"Welcome to Portal  "+result[0].firstname});
            return;
        }
        res.redirect('/');
    })
})

router.get('/profile',(req,res,next)=>{
    let userid = req.session.user;
    db.query('SELECT * FROM User WHERE id = ?',[userid],(err,result)=>{
        if(userid){
           return res.render('profile', { user :result[0]});
        }
        res.redirect('/');
    })
})


router.post('/updateprofile',(req,res,next)=>{
    let userid = req.session.user;

    const id = req.body.id;
    const fname = req.body.fname;
    const lname = req.body.lname;
    // const password = req.body.password;
    console.log(fname+" "+lname);
    console.log("id "+id);
    console.log("userid "+userid);
    // if(!password){
        db.query('update User SET firstname = ? ,lastname =? WHERE id = ?',[fname,lname,id],(err,result)=>{
            if(userid){
               return res.render('home', { updatemsg :"Details Updated Successfully"}); 
            }
            res.redirect('/');
        })
    // }

})

router.post('/updatePassword',async(req,res,next)=>{
    let userid = req.session.user;

    // const id = req.body.id;
    const password = req.body.password;
    const cpassword = req.body.cpassword;

    if(password != cpassword){
        return res.render("changepassword",{
            message:"Password does not match"
        });
    }else if(!schema.validate(password)){
        return res.render("changepassword",{
            message:"Please enter strong password"
        });
    }else {
    
    // const password = req.body.password;
    
    console.log("userid "+userid);
    let hashedPassword = await bcrypt.hash(password,8);
        db.query('update User SET password = ? WHERE id = ?',[hashedPassword,userid],(err,result)=>{
            if(userid && result.affectedRows>0){
               return res.render('home', { updatemsg :"Password Updated Successfully"}); 
            }
            return res.render('home', { updatemsg :"Password Update UnSuccessful"}); 
        })
    }     
})



router.post('/login',async(req,res)=>{
    try {
        const {email , password} = req.body;
       
        if(!email||!password){
            return res.status(400).render('login',{
                message :'Please provide an Email Address and Password'
            });
        }

        db.query('SELECT * FROM User WHERE email = ?',[email],async(error,results)=>{
            if(error){
                console.log(error);
            }
            // console.log("Hi "+results.length);  
            if(results.length == 0){
                return res.render("login",{
                    message:"Email Address does not exists"
                });
            }else if(!(await bcrypt.compare(password,results[0].password))){
                return res.render("login",{
                    message:"Password is incorrect"
                });
            }
            else {
                req.session.user = results[0].id;
                res.redirect('/auth/home')
                // return res.render("home",{
                //     message: results[0].firstname+' '+ results[0].lastname
                // });
            }
        })
        

    } catch (error) {
        console.log(error);
    }
})







module.exports = router;