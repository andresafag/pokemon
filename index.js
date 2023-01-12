const fs = require('fs')
const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      axios = require('axios')

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.set('view engine','pug')
app.use(express.static('public'))

app.get("/", (req, res)=>{

res.render("index")
})

app.listen(10000, (err)=>{
  if(err) console.log("No working")
  console.log("Listening on port 10000");
})
