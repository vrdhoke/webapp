const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const models = require("../models");
const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();

aws.config.update({
  secretAccessKey: "9Ks68JxlCCjqyJf8uKJ+JGiZukLB7rTOcmBLBpTj",
  accessKeyId: "AKIAYFKCXGXDS2ABFVUA",
  region: "us-east-1",
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    // return res.json("Only JPEG and PNG and JPG is allowed");
    req.fileValidationError = "Only JPEG and PNG and JPG is allowed"
    return cb("File format should be PNG,JPG,JPEG",null, false,req.fileValidationError);
  }
};

const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    bucket: "vaibhavdhokes3",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.originalname });
    },
    key: function (req, file, cb) {
      cb(null, file.originalname+Date.now().toString());
    },
  }),
});

// const singleUpload = upload.single("image");

router.post("/uploadimage", async (req, res) => {
    // singleUpload(req, res, function (err) {
    //   if (err) {
    //     return res.status(422).send({
    //       errors: [{ title: "File Upload Error", detail: err.message }],
    //     });
    //   }
    //   models.Image.create({
    //     s3imagekey: req.file.key,
    //     fileName: req.file.originalname,
    //     contentType: req.file.mimetype,
        
    //   })
    //     .then((newBook) => {
    //       console.log(newBook);
    //     })
    //     .catch((err) => {
    //       console.log("Error UpLoading Image: ", err);
    //     });
    //   return res.json({ imageUrl: req.file.key });
    // });
  });


  router.get('/getImage',(req,res)=>{
    async function getImage(){
            const data =  s3.getObject(
              {
                  Bucket: 'vaibhavdhokes3',
                  Key: '1592100348951'
              }
              
            ).promise();
            return data;
          }
    getImage()
          .then((img)=>{
              let image="<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
              let startHTML="<html><body></body>";
              let endHTML="</body></html>";
              let html=startHTML + image + endHTML;
            res.send(html)
          }).catch((e)=>{
            res.send(e)
          })
    function encode(data){
              let buf = Buffer.from(data);
              let base64 = buf.toString('base64');
              return base64
          }
    })
  
module.exports = upload;



