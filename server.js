'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

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
  let url, urlStr = req.body.url.trim();
  
  // If submitted url doesn't start with 'http://' or 'https://' return early with error response.
  if (!/^https?\:\/\//.test(urlStr)) return res.json({"ERROR": "INVALID URL"});

  // Create a URL object from the submitted url
  url = new URL(urlStr);
  console.log(url);
  
  // verify url exists
  dns.lookup(url.host + url.pathname, (err, address) => {
    let log;
    err ? log = err : log = address;
    console.log(log);
  });
  // console.log(url);
  res.json({"original_url": urlStr, "url": url.host});
  // res.send("POST submitted");
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});