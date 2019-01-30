'use strict';
require('dotenv').config(); // comment this out on Glitch
const express = require('express');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const cors = require('cors');

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
/** MONGOOSE CONNECT */
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

/** SCHEMAS and MODELS */
const Schema = mongoose.Schema;

const shortUrlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: Number
});

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);


/** MIDDLEWARE */
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

// static files
app.use('/public', express.static(process.cwd() + '/public'));

/** ROUTES */
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/env", function (req, res) {
  // res.json(process);
  console.log(req.headers.host);
  res.send('done');
});

// shoturl req route
app.get("/api/shorturl/:num?", function (req, res) {
  let num = req.params.num;
  res.send("num: " + num);
});

app.post("/api/shorturl/new", [checkForDuplicateUrl, checkUrlAndHost, assignShortUrl], function (req, res) {
 console.log(req.body);
  /** Steps
   * 1. Accept/verify url
   * 2. dns verify host exists
   * 3. Check db for ShortUrl docs - get count.
   * 4. Create new ShortUrl doc using docs count + 1 as shorturl.
   * 5. Save new ShortUrl to db.
   */
  let shortUrl = new ShortUrl({
    original_url: req.body.url,
    short_url: req.body.shorturl
  });

  shortUrl.save((err, data) => err ? console.log(err) : res.json(data));
  
  // res.send("POST submitted");
});

function checkUrlAndHost (req, res, next) {
  // Trim any whitespace from the ends of the submitted url
  // req.body.url = req.body.url.trim();
  // If submitted url doesn't start with 'http://' or 'https://' return early with error response.
  if (!/^https?\:\/\//.test(req.body.url)) {
    return res.json({"error":"invalid URL"});
  } else {
    let url = new URL(req.body.url);
    // verify host exists
    dns.lookup(url.host, (err, address) => {
      if (err) {
        return res.json({"error":"invalid host"});
      } else {
        next();
      }
    });
  }
}


function assignShortUrl(req, res, next) {
  ShortUrl.countDocuments((err, count) => {
    if (err) {
      console.log(err)
      res.json({"Error": "Database error"});
    } else {
      req.body.shorturl = count + 1;
      next();
    }
  });
}

function checkForDuplicateUrl(req, res, next) {
  // Trim any whitespace from the ends of the submitted url
  req.body.url = req.body.url.trim();
  ShortUrl.findOne({original_url: req.body.url}, function (err, shortUrl) {
    if (err) {
      console.log(err);
    } else {
      shortUrl ? res.json(shortUrl) : next(); 
    }
  });
}



app.listen(port, function () {
  console.log('Node.js listening ...');
});