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

// const singleUpload = upload.array("image",3);

router.post("/addbook",upload.array("image"),(req,res)=>{
    const user = req.session.user;
    const {isbn,title,author,pdate,qty,price} = req.body;
    
    console.log("isbn "+isbn);
    console.log("isbn "+req.body.isbn);
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
    console.log(req.files);

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
            var fileKeys = Object.keys(req.files);

            fileKeys.forEach(function(key) {
                console.log(req.files[key]);
                model.Image.create({
                  s3imagekey: req.files[key].key,
                  fileName: req.files[key].originalname,
                  contentType: req.files[key].mimetype,
                  bookid:newBook.id
                })
                  .then((newBook) => {
                    console.log(newBook);
                  })
                  .catch((err) => {
                    console.log("Error UpLoading Image: ", err);
                  });
                // return res.json({ imageUrl: req.file.key });
                
            });

            
          // });
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


router.get("/updateImage/:id",async(req,res)=>{
  const user = req.session.user;
  aws.config.update({
    secretAccessKey: "9Ks68JxlCCjqyJf8uKJ+JGiZukLB7rTOcmBLBpTj",
    accessKeyId: "AKIAYFKCXGXDS2ABFVUA",
    region: config.region,
  });
  
  const s3 = new aws.S3();
  if(user){
    const images = await model.Image.findAll({
      where: { bookid:req.params.id },raw:true
    })
    console.log(images)
    var s3image = [];
    for (var i = 0; i < images.length; i++) { 
      console.log("Key "+images[i].s3imagekey);
      await getImage(images[i].s3imagekey)
      .then((img)=>{
          s3image.push({skey:images[i].s3imagekey,simg:encode(img.Body)});
          // let image="<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
          // html=html+image;
        
      }).catch((e)=>{
        console.log("Error Vaibhav");
        res.send(e)
      })
    }
    console.log(s3image.length);
    return res.render("updateImages", {
      simages: s3image,bookid:req.params.id
    });
  }else {
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
  const user = req.session.user;
  aws.config.update({
    secretAccessKey: "9Ks68JxlCCjqyJf8uKJ+JGiZukLB7rTOcmBLBpTj",
    accessKeyId: "AKIAYFKCXGXDS2ABFVUA",
    region: config.region,
  });
  
  const s3 = new aws.S3();
  if(user){
    const images = await model.Image.destroy({
      where: { s3imagekey:req.params.id }
    })
    
    var params = {
      Bucket: config.s3bucket, 
      Key: req.params.id
     };

    s3.deleteObject(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });

    return res.render("updatebook", {
      message:"Image Deleted Successfully"
    });

  }else {
    return res.redirect("/");
  }
      
})


router.post("/addImage",upload.array("image"),(req,res)=>{
  const user = req.session.user;
  const bookid = req.body.bookid;
  
  
  if(user){
  // if (!(/^,?[a-zA-Z][a-zA-Z0-9]*,?$/.test(author)))
  
          console.log(req.files);

          var fileKeys = Object.keys(req.files);

          fileKeys.forEach(function(key) {
              console.log(req.files[key]);
              model.Image.create({
                s3imagekey: req.files[key].key,
                fileName: req.files[key].originalname,
                contentType: req.files[key].mimetype,
                bookid:bookid
              })
                .then((newBook) => {
                  console.log(newBook);
                })
                .catch((err) => {
                  console.log("Error UpLoading Image: ", err);
                });
              // return res.json({ imageUrl: req.file.key });
              
          });

          
        // });
        return res.render("updatebook", {
          message: "Image added successfully",
        });
    

    }else{
      return res.redirect('/');
    }
})


module.exports = router;
