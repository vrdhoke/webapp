const express = require("express");
const mysql = require("mysql");
const model = require("../models")
const router = express.Router();
const bcrypt = require("bcryptjs");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const upload = require("../routes/imageupload");
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
// const singleUpload = upload.array("image",3);

router.post("/addbook",upload.array("image"),(req,res)=>{
    var start = new Date().getTime();
    const user = req.session.user;
    const {isbn,title,author,pdate,qty,price} = req.body;
    
    log.info("isbn from request in addbook is "+req.body.isbn);
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
    log.info("files from request "+req.files);

    if(req.fileValidationError){
      return res.render("addbook", {
        message: "Only JPEG, PNG and JPG is allowed!",
        isbn:isbn,
        title:title,
        pdate:pdate,
        qty:qty,
        price:price
      });
    }
    // model.Image.create({
    //   s3imagekey:req.
      
    //   sellerId:user.id
    // })
    var startdb1 = new Date().getTime();
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
          // singleUpload(req, res, function (err) {
          //   if (err) {
          //     return res.status(422).send({
          //       errors: [{ title: "File Upload Error", detail: err.message }],
          //     });
          //   }
            var enddb1 = new Date().getTime();
            client.timing("sellbook.addbook.db",enddb1-startdb1);
            var fileKeys = Object.keys(req.files);

            fileKeys.forEach(function(key) {
                log.info("files "+req.files[key]);
                var startdb2 = new Date().getTime();
                model.Image.create({
                  s3imagekey: req.files[key].key,
                  fileName: req.files[key].originalname,
                  contentType: req.files[key].mimetype,
                  bookid:newBook.id
                })
                  .then((newBook) => {
                    var enddb2 = new Date().getTime();
                    client.timing("sellbook.addbookImageCreate.db",enddb2-startdb2);
                    log.info("Image "+newBook);
                  })
                  .catch((err) => {
                    log.info("Error UpLoading Image: ", err);
                  });
                // return res.json({ imageUrl: req.file.key });
                
            });

            
          // });
          return res.render("home", {
            updatemsg: "Book Added Successfully",
          });
        })
        .catch((err) => {
          log.info("Error while Adding Book : ", err);
        });

      }else{
        return res.redirect('/');
      }
      var end = new Date().getTime();
      client.timing("sellbook.addbookPOSTRequest",end-start);
})

router.get("/getMyBooks",(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  log.info("Books added by user route");
  if(user){
      var startdb1 = new Date().getTime();
      model.User.findAll({where:{id:user.id},raw: true,include:['sellbook']})
      .then((User) => {
        var enddb1 = new Date().getTime();
        client.timing("sellbook.getMyBooks.db",enddb1-startdb1);
        // console.log(User);
        if(User.length==1 && User[0]["sellbook.id"]==null){
          // console.log("Hurray");
          var end = new Date().getTime();
          client.timing("sellbook.getMyBooksGETRequest",end-start);
          return res.render("mysellbooks", {
            flag:null,message:"You have not added any book for sale"
          });
        }else{
          var end = new Date().getTime();
          client.timing("sellbook.getMyBooksGETRequest",end-start);
          return res.render("mysellbooks", {
            books:User,flag:true
          });
        }
        
      })
      .catch((err) => {
        log.info("Error while fetching Book : ", err);
      });
    }else {
      var end = new Date().getTime();
      client.timing("sellbook.getMyBooksGETRequest",end-start);
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
  var start = new Date().getTime();
  log.info("inside buybook route ");
  log.info("Book id to be bought "+req.params.id);
  var startdb1 = new Date().getTime();
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
      var enddb1 = new Date().getTime();
      client.timing("sellbook.buybook.db",enddb1-startdb1);
      return res.json(newBook)
    })
    .catch((err) => {
        return res.render('home', { updatemsg :"Book can not be bought at this time"}); 
    });   
    var end = new Date().getTime();
    client.timing("sellbook.buybookPOSTRequest",end-start);

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
  var start = new Date().getTime();
  const user = req.session.user;
  log.info("inside update book get route with book id "+req.params.id);
  if(user){
  var startdb1 = new Date().getTime();
  let book = await model.Book.findOne({
    where: { id: req.params.id},
  });
  var enddb1 = new Date().getTime();
  client.timing("sellbook.updateBookfindBook.db",enddb1-startdb1);
  if (book) {
    return res.render("updatebook", {
      ubook: book
    });
  }
  var end = new Date().getTime();
  client.timing("sellbook.updateBookGETRequest",end-start);
  }else 
  {
    var end = new Date().getTime();
    client.timing("sellbook.updateBookGETRequest",end-start);
    return res.redirect("/");}
})


router.post("/updatebook",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  const {id,isbn,title,author,publicationDate,qty,price} = req.body

  log.info("inside update book post route  ");

  if (!(/^\w+\s*\w*(,\w+\s*\w*)*$/.test(author)))
    {
      return res.render("addbook", {
        message: "Invalid Author names!",
      });
    }
  var startdb1 = new Date().getTime();  
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
      var enddb1 = new Date().getTime();
      client.timing("sellbook.updateBookPOST.db",enddb1-startdb1); 
      return res.render("home", {
        updatemsg:"Book Updated"
      });
    })
    .catch((err) => {
        return res.render('home', { updatemsg :"Book Update UnSuccessful"}); 
    });
    var end = new Date().getTime();
    client.timing("sellbook.updateBookPOSTRequest",end-start);   
})


router.get("/deletebook/:id",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  // aws.config.update({
  //   secretAccessKey: config.secretkey,
  //   accessKeyId: config.accesskey,
  //   region: config.region,
  // });
  log.info("inside delete book GET route ");
  const s3 = new aws.S3();
  if(user){
  const images = await model.Image.findAll({
    where: { bookid:req.params.id },raw:true
  });
  // console.log(images);
  for (var i = 0; i < images.length; i++) { 

    var params = {
      Bucket: config.s3bucket, 
      Key: images[i].s3imagekey
     };
    var startS3 = new Date().getTime();
    s3.deleteObject(params, function(err, data) {
      if (err) log.info(err, err.stack); // an error occurred
      else     log.info("Image deleted successfully "+data);           // successful response
    });
    var endS3 = new Date().getTime();
    client.timing("sellbook.deleteBookImage.S3",endS3-startS3);
  }
  var startdb1 = new Date().getTime();
  let book = await model.Book.destroy({
    where: { id: req.params.id},
  });
  var enddb1 = new Date().getTime();
  client.timing("sellbook.deleteBook.db",enddb1-startdb1);
  if (book) {
    log.info("Book deleted successfully ");
    return res.render('home', { updatemsg :"Book Deleted Successfully"}); 
  }
  }else {
    return res.redirect("/");
  }
  var end = new Date().getTime();
  client.timing("sellbook.deleteBookGETRequest",end-start); 
})


router.get("/updateImage/:id",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  // aws.config.update({
  //   secretAccessKey: config.secretkey,
  //   accessKeyId: config.accesskey,
  //   region: config.region,
  // });
  log.info("inside update image GET route ");
  const s3 = new aws.S3();
  if(user){
    const images = await model.Image.findAll({
      where: { bookid:req.params.id },raw:true
    })
    // console.log(images)
    var s3image = [];
    for (var i = 0; i < images.length; i++) { 
      // console.log("Key "+images[i].s3imagekey);
      var startS3 = new Date().getTime();
      await getImage(images[i].s3imagekey)
      .then((img)=>{
        var endS3 = new Date().getTime();
        client.timing("sellbook.updateImage.S3",endS3-startS3); 
          s3image.push({skey:images[i].s3imagekey,simg:encode(img.Body)});
          // let image="<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
          // html=html+image;
        
      }).catch((e)=>{
        log.info("Error Getting Images from S3 bucket",e);
        res.send(e)
      })
    }
    log.info("Number of Images for book "+req.params.id+" are "+s3image.length);
    var end = new Date().getTime();
    client.timing("sellbook.updateImageGETRequest",end-start); 
    return res.render("updateImages", {
      simages: s3image,bookid:req.params.id
    });
  }else {
    var end = new Date().getTime();
    client.timing("sellbook.updateImageGETRequest",end-start); 
    return res.redirect("/");
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
    
})


router.get("/deleteImage/:id",async(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  // aws.config.update({
  //   secretAccessKey: config.secretkey,
  //   accessKeyId: config.accesskey,
  //   region: config.region,
  // });
  log.info("inside delete image GET route");
  const s3 = new aws.S3();
  if(user){
    const images = await model.Image.destroy({
      where: { s3imagekey:req.params.id }
    })
    
    var params = {
      Bucket: config.s3bucket, 
      Key: req.params.id
     };
     var startS3 = new Date().getTime();
    s3.deleteObject(params, function(err, data) {
      if (err) log.info(err, err.stack); // an error occurred
      else     log.info("Image Deleted successfully "+data);           // successful response
    });
    var endS3 = new Date().getTime();
    client.timing("sellbook.deleteOneImage.S3",endS3-startS3);
    var end = new Date().getTime();
    client.timing("sellbook.deleteImageGETRequest",end-start); 
    return res.render("updatebook", {
      message:"Image Deleted Successfully"
    });

  }else {
    var end = new Date().getTime();
    client.timing("sellbook.deleteImageGETRequest",end-start); 
    return res.redirect("/");
  }

})


router.post("/addImage",upload.array("image"),(req,res)=>{
  var start = new Date().getTime();
  const user = req.session.user;
  const bookid = req.body.bookid;
  
  log.info("inside addimage POST route");
  if(user){
  // if (!(/^,?[a-zA-Z][a-zA-Z0-9]*,?$/.test(author)))
  
          // console.log(req.files);

          var fileKeys = Object.keys(req.files);

          fileKeys.forEach(function(key) {
              // console.log(req.files[key]);
              var startdb1 = new Date().getTime();
              model.Image.create({
                s3imagekey: req.files[key].key,
                fileName: req.files[key].originalname,
                contentType: req.files[key].mimetype,
                bookid:bookid
              })
                .then((newBook) => {
                  var enddb1 = new Date().getTime();
                  client.timing("sellbook.addImage.db",enddb1-startdb1);
                  log.info(newBook);
                })
                .catch((err) => {
                  log.info("Error UpLoading Image: ", err);
                });
              // return res.json({ imageUrl: req.file.key });
              
          });

          
        // });
        log.info("Image added successfully");
        var end = new Date().getTime();
        client.timing("sellbook.addImagePOSTRequest",end-start); 
        return res.render("updatebook", {
          message: "Image added successfully",
        });
    }else{
      var end = new Date().getTime();
      client.timing("sellbook.addImagePOSTRequest",end-start); 
      return res.redirect('/');
    }
})


module.exports = router;
