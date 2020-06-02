const express = require("express");
const mysql = require("mysql");
const model = require("../models")
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");


router.get("/getAllBooks",async(req,res)=>{
  const user = req.session.user;
  if(user){
    //   model.Book.findAll({where:{sellerId:{[Op.ne]:user.id}},order: [
    //     ['isbn', 'ASC'],
    //     ['price', 'ASC'],
        
    // ]})
    //   .then((Books) => {
    //     console.log("Hi"+Books);
    //     // return res.json(Books)
    //     return res.render("buybooks", {
    //       books:Books
    //     });
    //   })
    //   .catch((err) => {
    //     console.log("Error while fetching Book : ", err);
    //   });
    const result = await model.sequelize.query(
      "SELECT firstName,lastName,Books.id,isbn,title,authors,publication_date,quantity,price FROM Books join Users on Books.sellerid=Users.id where Books.sellerid != (:id) order by isbn,price",
      {
        replacements: { id: user.id },
        type: model.sequelize.QueryTypes.SELECT,
      }
    );
    console.log(result);
    if(result){
      return res.render("buybooks", {
              books:result
       });
    }
   
    }
    else{
      res.redirect('/');
    }
      // model.User.findAll({where:{id:"12"},raw: true,
      // include:['sellbook']})
      // .then(user=>{
      //   // console.log(user[1]['sellbook.isbn']);
      //   console.log(user);
      //   res.json(user)})
      
        // console.log(user[0].sellbook);
      
})


router.get("/myCart",async(req,res)=>{
  const user = req.session.user;

  // const userOrders = await model.UserOrders.findAll({
  //   where: { userid:user.id },raw:true
  // });

  const user1 = await model.User.findAll({
    where: { id:user.id },include:['books'],raw:true
  }).then((User) => {
    console.log(User);
    return res.render("myCart", {
      books:User
    });
  })

  // if(user){
  //   return res.render("buybook",{
  //     ubook:book
  //   })
  // }
  // return res.json(user1)
  // console.log("book "+user1.books);
})



router.get("/:id",async(req,res)=>{
  const user = req.session.user;
  const id = req.params.id;

  const book = await model.Book.findOne({
    where: { id: id },
  });

  if(user){
    return res.render("buybook",{
      ubook:book
    })
  }
  console.log("book "+book);
})



router.post("/buy",async(req,res)=>{
  const user1 = req.session.user;
  const id = req.body.id;
  const qty = req.body.qty;
  const user = await model.User.findOne({
    where: { id: user1.id},
  });
  // .then(user=>{
  //     console.log(user);
  //     // res.json(user)
  //   })
  console.log("Hello "+user);

  const book = await model.Book.findOne({
    where: { id: id },
  });

  if(book.quantity<qty){
    return res.render("buybook",{
      message:"This quanity is not available",ubook:book
    })
  }
  console.log("book "+book);


   const userOrders = await model.UserOrders.findOne({
    where: { userid:user.id,bookid:id }
  });

  if(userOrders){
    console.log(userOrders.quantity);
    const totalquant = parseInt(qty) + userOrders.quantity
    await user.addBook(book,{ through: { quantity: totalquant} });  
  }else {
    await user.addBook(book,{ through: { quantity: qty } });
  }
  console.log("Here") 

  model.Book.update(
    { quantity:book.quantity-qty},
    {
      where: {
        id:id
      },
    }
  )
    .then((newBook) => {
      return res.render("home",{
        updatemsg:book.title+" added to the cart"
      })
    })
    .catch((err) => {
        return res.render('home', { updatemsg :"Error adding book"}); 
    }); 

  

  const result = await model.User.findOne({
    where: { id:user.id },
    include: ['books']
  });
  console.log(result);



  //Vaibhav

  // model.Book.update(
  //   { buyerId: 11},
  //   {
  //     where: {
  //       id:req.params.id
  //     },
  //   }
  // )
  //   .then((newBook) => {
  //     // console.log(newUsers);
  //     return res.json(newBook)
  //   })
  //   .catch((err) => {
  //       return res.render('home', { updatemsg :"Password Update UnSuccessful"}); 
  //   });   
  

  // model.User.findAll({where:{id:"11"},
  // include:['sellbook']})
  // .then(sellbooks=>res.json(sellbooks))
})

module.exports = router;
