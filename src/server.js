const fs = require('fs') 
const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      axios = require('axios')

const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.set('view engine','pug')
app.use(express.static('public'))

app.get("/", (req, res)=>{
res.render("index")
})


app.listen(PORT, (err)=>{
  if(err) console.error("No working")
  console.log(`Listening on port ${PORT}`);
})
