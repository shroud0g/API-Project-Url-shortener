'use strict';
require('dotenv').config({path: __dirname + '/.env'});
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var dns = require('dns');

var cors = require('cors');

var app = express();

var urlSchema = new mongoose.Schema({
  url: String,
  short: String
});
// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

var Shorten = mongoose.model('Shorten', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});



//URL shortener API
app.post('/api/shorturl/new', (req, res) => {
  let url = req.body.url;
  //Removes https/http://
  let remover = /^((https?)+:\/?\/?)?/gi;
  let hostname = url.replace(remover, '');
  url = 'https://' + hostname;
  //Checks if url is valid
  dns.lookup(hostname, (err, address) => {
    if (err) {
      res.json({error: 'invalid uri'}).end();
    }
    else {
    //Find if in database
    Shorten.findOneAndUpdate({url: url}, {short: shortid.generate()}, {new: true, upsert: true}, function(err, data) {
      if (err) throw err;
      res.json({url: data.url, shorturl: 'https://wry-stag.glitch.me/api/shorturl/' + data.short});
      }) 
    }
  });
})
//Get url from database using shortid
app.get('/api/shorturl/:short', (req, res) => {
  let short = req.params.short;
  Shorten.findOne({short: short}, (err, data) => {
    if (err) {
      return res.json({error: 'Link does not exist'});
    }
    return res.redirect(301, data.url);
  })
})


app.listen(port, function () {
  console.log('Node.js listening ...', port);
});