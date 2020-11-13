// 'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var dotenv = require('dotenv').config({ path: './.env' });

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then((con) => {
    // console.log(con.connections);
    console.log("DB connection successful.");
  })
  .catch((err) => console.log(err));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// mongoose schema
const urlEntrySchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String, 
    required: true
  }
})

// mongoose model
const urlEntryModel = mongoose.model(`url-entries`, urlEntrySchema);
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", (req, res) => {

// READ THE DB 
// ADD THE NEXT ENTRY IN THE SEQUENCE 

let originalUrl = req.body.url;
// remove http:// / https:// -- dns.lookup only accepts domain
let protocolRemoved = originalUrl.replace(/(^\w+:|^)\/\//, '');
// check url is valid
dns.lookup(protocolRemoved, (err, address, family) => {
  // remove http://
  if (err === null) {
  urlEntryModel.find().sort('_id').limit(15).find((err, entries) => {
  // last entry in the db
  console.log(entries[entries.length-1]);
  let shortUrl = parseInt(entries[entries.length-1].short_url) + 1;
  // create new entry
  urlEntryModel.create({ original_url: originalUrl, short_url: shortUrl})

  // send response
  res.send({original_url: originalUrl, short_url: shortUrl});
});
  } else {
    console.log(address);
    res.send({"error":"invalid URL"})
  }
})
})

app.get("/api/shorturl/:route", (req, res) => {
  // read the route param
  let requestedRoute = req.params.route.toString();
  console.log(requestedRoute);

  // read the db
  urlEntryModel.findOne({short_url: requestedRoute}, (err, entry) => {
    if (err) {
      console.log(err)
      res.send({"error":"invalid URL"})
    } else {
      console.log(entry.original_url)
      res.redirect(entry.original_url)
    }
  });

})

app.listen(port, function () {
  console.log('Node.js listening ...');
});
