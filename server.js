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
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

const Schema = mongoose.Schema;

let shortUrlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: Number
});

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// shoturl req route
app.get("/api/shorturl/:num?", function (req, res) {
  let num = req.params.num;
  res.send("num: " + num);
});

app.post("/api/shorturl/new", function (req, res) {

  /** Steps
   * 1. Accept/verify url
   * 2. dns verify host exists
   * 3. Check db for ShortUrl docs - get count.
   * 4. Create new ShortUrl doc using docs count + 1 as shorturl.
   * 5. Save new ShortUrl to db.
   */
  let url, urlStr = req.body.url.trim();
  
  // If submitted url doesn't start with 'http://' or 'https://' return early with error response.
  if (!/^https?\:\/\//.test(urlStr)) return res.json({"ERROR": "INVALID URL"});

  url = new URL(urlStr);
  console.log(url);


  // verify host exists
  dns.lookup(url.host, (err, address) => {
    // let log;
    // err ? log = err : log = address;
    // console.log(log);
    if (err) return res.json({"ERROR": "INVALID URL"});

    res.json({"original_url": url.href, "url": "?"});
  });
  // 
  
  // res.send("POST submitted");
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});