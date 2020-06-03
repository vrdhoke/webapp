const express = require("express");
const mysql = require("mysql");
const model = require("../models")
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



router.post('/register',async(req,res)=>{
    console.log(req.body);
    
    const {firstname,lastname,email,password} = req.body;
    if (!(/^[A-Za-z]+([\ A-Za-z]+)*$/.test(firstname)))
    {
      return res.render("register", {
        message: "First Name is Invalid!",
      });
    }
    if (!(/^[A-Za-z]+([\ A-Za-z]+)*$/.test(lastname)))
    {
      return res.render("register", {
        message: "Last Name is Invalid!",
      });
    }
    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)))
    {
      return res.render("register", {
        message: "Email address is invalid!",
      });
    }

      
    let user = await model.User.findOne({
        where: { email: email },
      });
      if (user) {
        return res.render("register", {
          message: "Email id already registered!",
        });
      }


    if(!schema.validate(password)){
                return res.render("register",{
                    message:"Please enter strong password"
                });
    }
    let hashedPassword = await bcrypt.hash(password,8);

    model.User.create({
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: hashedPassword,
      })
        .then((newUsers) => {
          // console.log(newUsers);
          return res.render("login", {
            message: "User registered",
          });
        })
        .catch((err) => {
          console.log("Error while users creation : ", err);
        });

    // db.query('SELECT email FROM User WHERE email = ?',[email],async(error,results)=>{
    //     if(error){
    //         console.log(error);
    //     }

    //     if(results.length > 0){
    //         return res.render("register",{
    //             message:"Email Address is Already in Use"
    //         });
    //     }else if(!schema.validate(password)){
    //         return res.render("register",{
    //             message:"Please enter strong password"
    //         });
    //     }
    //     let hashedPassword = await bcrypt.hash(password,8);

    //     console.log(hashedPassword);

    //     db.query('INSERT INTO User SET ?',{email:email,password :hashedPassword,firstname :fname, lastname:lname},(error,results)=>{
    //         if(error){
    //             console.log(error);
    //         }else {
    //             console.log(results.insertId);
    //             req.session.user = results.insertId
                
    //             res.status(201);
    //             res.render("register",{
    //                 message:"Registered Successfully"
    //             },function(err, html) {
    //                 console.log(html);
    //                 res.send("Registered Successfully");
    //             });
                
    //         }
    //     })
    // })

});

router.get('/home',async(req,res,next)=>{
    let suser = req.session.user;
        if(suser){
          let user = await model.User.findOne({
            where: { email: suser.email },
          });
            res.render('home',{ message:"Welcome to Portal  "+user.firstname});
            return;
        }
        res.redirect('/');
    
})

router.get('/profile',async(req,res,next)=>{
    
    let suser = req.session.user;
    if (suser) {
    let user = await model.User.findOne({
      where: { id:suser.id},
    });
      return res.render("profile", {
        user: user
      });
    }else res.redirect('/');
        
})


router.post('/updateprofile',async(req,res,next)=>{
    let user = req.session.user;

    if(user){

    const id = req.body.id;
    const fname = req.body.fname;
    const lname = req.body.lname;
    // const password = req.body.password;
    console.log(fname+" "+lname);
    console.log("id "+id);
    if (!(/^[A-Za-z]+([\ A-Za-z]+)*$/.test(fname)))
    {
      return res.render("updateprofile", {
        message: "First Name is Invalid!",
      });
    }
    if (!(/^[A-Za-z]+([\ A-Za-z]+)*$/.test(lname)))
    {
      return res.render("updateprofile", {
        message: "Last Name is Invalid!",
      });
    }
    
    await model.User.update(
        { firstname:fname,
        lastname:lname},
        {
          where: {
            email: user.email
          },
        }
      )
        .then(() => {
            if(user){
                return res.render('home', { updatemsg :"Details Updated Successfully"}); 
             }
             res.redirect('/');
        })
        .catch((err) => {
            return res.render('home', { updatemsg :"Update UnSuccessful"}); 
        });
      }else{
        res.redirect('/');
      }
})

router.post('/updatePassword',async (req,res,next)=>{
    let user = req.session.user;

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
    
        let hashedPassword = await bcrypt.hash(password,8);
        model.User.update(
            { password:hashedPassword},
            {
              where: {
                email: user.email
              },
            }
          )
            .then(() => {
              console.log("Done");
              return res.render("home", {
                updatemsg: "Password Updated Successfully",
              });
            })
            .catch((err) => {
                return res.render('home', { updatemsg :"Password Update UnSuccessful"}); 
            });    


    // const password = req.body.password;
    
    // console.log("userid "+userid);
    // let hashedPassword = await bcrypt.hash(password,8);
    //     db.query('update User SET password = ? WHERE id = ?',[hashedPassword,userid],(err,result)=>{
    //         if(userid && result.affectedRows>0){
    //            return res.render('home', { updatemsg :"Password Updated Successfully"}); 
    //         }
    //         return res.render('home', { updatemsg :"Password Update UnSuccessful"}); 
    //     })
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

        let user = await model.User.findOne({
            where: { email: email },
          });
          if (!user) {
            return res.render("login", {
              message: "Email id does not exists!",
            });
          }else if(!(await bcrypt.compare(password,user.password))){
            return res.render("login",{
                message:"Password is incorrect"
            });
        } else {
            req.session.user = user;
            // res.json(user);
            res.redirect('/auth/home')
            // return res.render("home",{
            //     message: results[0].firstname+' '+ results[0].lastname
            // });
        }



        // db.query('SELECT * FROM User WHERE email = ?',[email],async(error,results)=>{
        //     if(error){
        //         console.log(error);
        //     }
        //     // console.log("Hi "+results.length);  
        //     if(results.length == 0){
        //         return res.render("login",{
        //             message:"Email Address does not exists"
        //         });
        //     }else if(!(await bcrypt.compare(password,results[0].password))){
        //         return res.render("login",{
        //             message:"Password is incorrect"
        //         });
        //     }
        //     else {
        //         req.session.user = results[0].id;
        //         res.redirect('/auth/home')
        //         // return res.render("home",{
        //         //     message: results[0].firstname+' '+ results[0].lastname
        //         // });
        //     }
        // })
        

    } catch (error) {
        console.log(error);
    }
})


module.exports = router;