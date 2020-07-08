const express = require("express");
const mysql = require("mysql");
const model = require("../models")
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const upload = require("../routes/imageupload");
const aws = require("aws-sdk");
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
var StatsD = require('node-statsd'),
      client = new StatsD();
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './log/application.log',
    }]
});
router.get("/getAllBooks",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  log.info("In All books for sale route");
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
    var startdb = new Date().getTime();
    const result = await model.sequelize.query(
      "SELECT firstName,lastName,Books.id,isbn,title,authors,publication_date,quantity,price FROM Books join Users on Books.sellerid=Users.id where Books.sellerid != (:id) and Books.quantity != (:q) order by isbn,price",
      {
        replacements: { id: user.id,q:0 },
        type: model.sequelize.QueryTypes.SELECT,
      }
    );
    var enddb = new Date().getTime();
    var end = new Date().getTime();
    client.timing("getAllBook.db",enddb-startdb);
    log.info(result);
    if(result){
      var end = new Date().getTime();
      client.timing("getAllBooks",end-start);
      return res.render("buybooks", {
              books:result
       });
    }
   
    }
    else{
      var end = new Date().getTime();
      client.timing("getAllBooks",end-start);
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
  var start = new Date().getTime();
  const user = req.session.user;
  log.info("In mycart GET route");
  // const userOrders = await model.UserOrders.findAll({
  //   where: { userid:user.id },raw:true
  // });
  if(user){
    var startdb = new Date().getTime();
  const user1 = await model.User.findAll({
    where: { id:user.id },include:['books'],raw:true
  }).then((User) => {
    var enddb = new Date().getTime();
    client.timing("myCartGETrequest.db",enddb-startdb); 
    // console.log(User[0]["books.id"]);
    if(User.length==1 && User[0]["books.id"]==null){
      // console.log("Hurray");
      return res.render("myCart", {
        flag:null,message:"Your Cart is Empty"
      });
    }else{
      return res.render("myCart", {
        books:User,flag:true
      });
    }
    
  })
  var end = new Date().getTime();
  client.timing("myCartGETrequest",end-start);  
}else{
  var end = new Date().getTime();
  client.timing("myCartGETrequest",end-start); 
    res.redirect('/');
  }

  // if(user){
  //   return res.render("buybook",{
  //     ubook:book
  //   })
  // }
  // return res.json(user1)
  // console.log("book "+user1.books);
})



router.get("/:id",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  const id = req.params.id;
  var startdb = new Date().getTime();
  const book = await model.Book.findOne({
    where: { id: id },
  });
  var enddb = new Date().getTime();
  client.timing("viewBookRequest.db",enddb-startdb); 
  client.increment(book.title);
  if(user){
    return res.render("buybook",{
      ubook:book
    })
  }
  log.info("Book viewed to buy "+book);
  var end = new Date().getTime();
  client.timing("viewBookRequest",end-start); 
})



router.post("/buy",async(req,res)=>{
  var start = new Date().getTime();
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
  log.info("in buybook/buy POST route ");
  var startdb1 = new Date().getTime();
  const book = await model.Book.findOne({
    where: { id: id },
  });
  var enddb1 = new Date().getTime();
  client.timing("buybook.findbook.db",enddb1-startdb1); 
  if(book.quantity<qty){
    return res.render("buybook",{
      message:"This quanity is not available",ubook:book
    })
  }
  log.info("book to be bought"+book);

  var startdb2 = new Date().getTime();
   const userOrders = await model.UserOrders.findOne({
    where: { userid:user.id,bookid:id }
  });
  var enddb2 = new Date().getTime();
  client.timing("buybook.findUserOrders.db",enddb2-startdb2); 
  if(userOrders){
    log.info("previous book bougth quantity "+userOrders.quantity);
    const totalquant = parseInt(qty) + userOrders.quantity
    await user.addBook(book,{ through: { quantity: totalquant} });  
  }else {
    await user.addBook(book,{ through: { quantity: qty } });
  }
  // console.log("Here") 

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
  // console.log(result);

  var end = new Date().getTime();
  client.timing("buybook.buyPOSTRequest",end-start); 
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

router.get("/cartupdate/:id",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  log.info("inside cartupdate GET route");
  if(user){

  let book = await model.Book.findOne({
    where: { id: req.params.id},
  });
  const userOrders = await model.UserOrders.findOne({
    where: { userid:user.id,bookid:req.params.id }
  });

  if (book) {
    var end = new Date().getTime();
    client.timing("buybook.cartupdateGETRequest",end-start); 
    return res.render("myCartUpdate", {
      ubook: book,qty:userOrders.quantity, aqty:book.quantity
    });
  }

  }else{
    var end = new Date().getTime();
    client.timing("buybook.cartupdateGETRequest",end-start);
    res.redirect('/');
  }
})

router.post("/cartupdate",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  const updatedQuanity = req.body.qty;
  const id = req.body.id;
  log.info("inside cartupdate POST route");

  var startdb1 = new Date().getTime();
  let book = await model.Book.findOne({
    where: { id: id},
  });
  var enddb1 = new Date().getTime();
  client.timing("buybook.cartupdatefindbook.db",enddb1-startdb1);

  var startdb2 = new Date().getTime();
  const userOrders = await model.UserOrders.findOne({
    where: { userid:user.id,bookid:id }
  });
  var enddb2 = new Date().getTime();
  client.timing("cartupdatefindUserOrders.db",enddb2-startdb2);

  if(parseInt(updatedQuanity)-userOrders.quantity > book.quantity){
    return res.render("myCartUpdate", {
      message: "This quantity is not available"
    });
  }

  const difference = parseInt(updatedQuanity) - userOrders.quantity;

  var startdb3 = new Date().getTime();
  await model.UserOrders.update({
    quantity:updatedQuanity
  },
  {
    where:{
      bookid:id, userid:user.id
    }
  })
  var enddb3 = new Date().getTime();
  client.timing("cartupdateUserOrdersupdate.db",enddb3-startdb3);
   
  await model.Book.update(
    { 
      quantity:book.quantity - difference
    },
    {
      where: {
        id:id
      }
    }
  )
  var startdb4 = new Date().getTime();  
  const user1 = await model.User.findAll({
    where: { id:user.id },include:['books'],raw:true
  }).then((User) => {
    // console.log(User);
    return res.render("myCart", {
      books:User,flag:true
    });
  })
  var enddb4 = new Date().getTime();
  client.timing("cartupdatefindUsers.db",enddb4-startdb4);
  var end = new Date().getTime();
  client.timing("buybook.cartupdatePOSTRequest",end-start);
})


router.get('/getImage/:id',async(req,res)=>{
      var start = new Date().getTime();
      // aws.config.update({
      //   secretAccessKey: config.secretkey,
      //   accessKeyId: config.accesskey,
      //   region: config.region,
      // });
      log.info("inside getImage GET route");
      const s3 = new aws.S3();
      const user = req.session.user;

      // const userOrders = await model.UserOrders.findAll({
      //   where: { userid:user.id },raw:true
      // });
      if(user){
      var startdb1 = new Date().getTime();
      const images = await model.Image.findAll({
        where: { bookid:req.params.id },raw:true
      })
      var enddb1 = new Date().getTime();
      client.timing("buybook.getImage.db",enddb1-startdb1); 
      // console.log(images)
      var s3image = [];
      for (var i = 0; i < images.length; i++) { 
        // console.log("Key "+images[i].s3imagekey);
        var startS3 = new Date().getTime();
        await getImage(images[i].s3imagekey)
        .then((img)=>{
          var endS3 = new Date().getTime();
          client.timing("buybook.getImage.S3",endS3-startS3);
            s3image.push(encode(img.Body));
            // let image="<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
            // html=html+image;
          
        }).catch((e)=>{
          log.info("Error getting Images from S3 bucket",e);
          res.send(e)
        })
      }
      // console.log(s3image.length);
      return res.render("viewImages", {
        simages: s3image
      });
      }else{
        res.redirect('/');
      }


  async function getImage(s3key){
          const data =  s3.getObject(
            {
                Bucket: config.s3bucket,
                Key: s3key
            }
            
          ).promise();
          return data;
        }
  
  function encode(data){
            let buf = Buffer.from(data);
            let base64 = buf.toString('base64');
            return base64
        }
  var end = new Date().getTime();
  client.timing("buybook.getImageRequest",end-start);      
  })

module.exports = router;
