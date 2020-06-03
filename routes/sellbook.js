const express = require("express");
const mysql = require("mysql");
const model = require("../models")
const router = express.Router();
const bcrypt = require("bcryptjs");

router.post("/addbook",(req,res)=>{
    const user = req.session.user;
    const {isbn,title,author,pdate,qty,price} = req.body;


    if(user){

    // if (!(/^,?[a-zA-Z][a-zA-Z0-9]*,?$/.test(author)))
    if (!(/^\w+\s*\w*(,\w+\s*\w*)*$/.test(author)))
    {
      return res.render("addbook", {
        message: "Invalid Author names!",
        isbn:isbn,
        title:title,
        pdate:pdate,
        qty:qty,
        price:price
      });
    }



    model.Book.create({
        isbn: isbn,
        title:title,
        authors:author,
        publication_date:pdate,
        quantity:qty,
        price:price,
        sellerId:user.id
      })
        .then((newBook) => {
          // console.log(newUsers);
          return res.render("home", {
            updatemsg: "Book Added Successfully",
          });
        })
        .catch((err) => {
          console.log("Error while Adding Book : ", err);
        });

      }else{
        return res.redirect('/');
      }
})

router.get("/getMyBooks",(req,res)=>{
  const user = req.session.user;
  if(user){
      model.User.findAll({where:{id:user.id},raw: true,include:['sellbook']})
      .then((User) => {
        console.log(User);
        if(User.length==1 && User[0]["sellbook.id"]==null){
          console.log("Hurray");
          return res.render("mysellbooks", {
            flag:null,message:"You have not added any book for sale"
          });
        }else{
          return res.render("mysellbooks", {
            books:User,flag:true
          });
        }
      })
      .catch((err) => {
        console.log("Error while fetching Book : ", err);
      });
    }else {
      return res.redirect('/');
    }

      // model.User.findAll({where:{id:"12"},raw: true,
      // include:['sellbook']})
      // .then(user=>{
      //   // console.log(user[1]['sellbook.isbn']);
      //   console.log(user);
      //   res.json(user)})
      
        // console.log(user[0].sellbook);
      
})


router.post("/buyBooks/:id",(req,res)=>{

  model.Book.update(
    { buyerId: 11},
    {
      where: {
        id:req.params.id
      },
    }
  )
    .then((newBook) => {
      // console.log(newUsers);
      return res.json(newBook)
    })
    .catch((err) => {
        return res.render('home', { updatemsg :"Password Update UnSuccessful"}); 
    });   
  

  // model.User.findAll({where:{id:"11"},
  // include:['sellbook']})
  // .then(sellbooks=>res.json(sellbooks))
})

router.get("/addbook",(req,res)=>{
  const user = req.session.user;
  if(user){
    return res.render("addbook");
  }return res.redirect("/");
})

router.get("/updatebook/:id",async(req,res)=>{
  const user = req.session.user;
  
  if(user){
  let book = await model.Book.findOne({
    where: { id: req.params.id},
  });
  if (book) {
    return res.render("updatebook", {
      ubook: book
    });
  }
  }else return res.redirect("/");
})


router.post("/updatebook",async(req,res)=>{
  const user = req.session.user;
  const {id,isbn,title,author,publicationDate,qty,price} = req.body

  

  if (!(/^\w+\s*\w*(,\w+\s*\w*)*$/.test(author)))
    {
      return res.render("addbook", {
        message: "Invalid Author names!",
      });
    }

  model.Book.update(
    { isbn:isbn,
      title:title,
      authors:author,
      publication_date:publicationDate,
      quantity:qty,
      price:price
    },
    {
      where: {
        id:id
      }
    }
  )
    .then((newBook) => {
      return res.render("home", {
        updatemsg:"Book Updated"
      });
    })
    .catch((err) => {
        return res.render('home', { updatemsg :"Book Update UnSuccessful"}); 
    });   
})


router.get("/deletebook/:id",async(req,res)=>{
  const user = req.session.user;
  if(user){
  let book = await model.Book.destroy({
    where: { id: req.params.id},
  });
  if (book) {
    return res.render('home', { updatemsg :"Book Deleted Successfully"}); 
  }
  }else {
    return res.redirect("/");
  }
})


module.exports = router;
