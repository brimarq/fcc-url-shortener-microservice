'use strict';
require('dotenv').config(); // comment this out on Glitch
const express = require('express');
const app = express();
// const mongo = require('mongodb'); // not sure why this was included w/the boilerplate 
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

// shoturl req route
app.get("/api/shorturl/:num?", function (req, res) {
  ShortUrl.findOne({short_url: req.params.num}, function (err, shortUrl) {
    if (err) {
      console.log(err);
    } else {
      // If shortUrl exists, redirect to the original_url, otherwise send json error.
      shortUrl ? res.redirect(shortUrl.original_url) : res.json({"error": "invalid shortURL"}); 
    }
  });
});

app.post("/api/shorturl/new", [checkForDuplicateUrl, checkUrlAndHost, assignShortUrl], function (req, res) {

  let shortUrl = new ShortUrl({
    original_url: req.body.url,
    short_url: req.body.shorturl
  });

  shortUrl.save((err, data) => err ? console.log(err) : res.json(data));
  
});

function checkUrlAndHost (req, res, next) {
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

// Assign shorturl nunber
function assignShortUrl(req, res, next) {
  ShortUrl.countDocuments((err, count) => {
    if (err) {
      console.log(err)
      res.json({"error": "database error"});
    } else {
      req.body.shorturl = count + 1;
      next();
    }
  });
}

function checkForDuplicateUrl(req, res, next) {
  // Trim any whitespace from the ends of the submitted url
  req.body.url = req.body.url.trim();

  // Check for duplicate - if exists, send response here with existing shorturl.
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