const express = require("express");
const mysql = require("mysql");
const  path = require("path");
const app = express();
const session = require("express-session");
var bodyParser = require('body-parser')
const db = require("./models");
var helpers = require('handlebars-helpers')();
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './log/application.log',
    }]
});
// const db = mysql.createConnection({
//     host: '127.0.0.1',
//     user:'root',
//     password:'12345678',
//     database:'CloudApp',
//     port:3306
// });



const publicDirectory = path.join(__dirname,'./public');

// log.info(publicDirectory);
app.use(express.static(publicDirectory));

// app.use(express.urlencoded({ extended:false}));

// app.use(express.json());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });


app.set('view engine','hbs');

app.use(session({
    name:'cookie',
    secret:'mysession',
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:60*1000*30
    }
}))

// db.connect((error)=>{
//     if(error)
//     {
//         console.log(error);
//     }else{
//         console.log("MySql Database Connected");
//     }
// });

app.use("/",require("./routes/pages"));
app.use("/auth",require("./routes/auth"));
app.use("/sellbook",require("./routes/sellbook"));
app.use("/buybook",require("./routes/buybook"));
// app.use("/image",require("./routes/imageupload"));

db.sequelize.sync().then(()=>{
    app.listen(5000,()=>{
        log.info("Server Started on port 5000");
    })
}) 

module.exports = app;