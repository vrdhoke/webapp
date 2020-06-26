const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const models = require("../models");
const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

// aws.config.update({
//   secretAccessKey: config.secretkey,
//   accessKeyId: config.accesskey,
//   region: config.region,
// });

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
    bucket: config.s3bucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.originalname });
    },
    key: function (req, file, cb) {
      cb(null, file.originalname+Date.now().toString());
    },
  }),
});

// const singleUpload = upload.single("image");

  
module.exports = upload;



