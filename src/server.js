const fs = require('fs') 
const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      { httpRequestsTotal, httpRequestDuration, activeRequests } = require('./telemetry');

const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.set('view engine','pug')
app.use(express.static('public'))
app.set("view cache", true)

app.use((req, res, next) => {
  const startTime = Date.now();
  activeRequests.add(1, { route: req.path });
  res.on('finish', () => {
    const durationSec = (Date.now() - startTime) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.add(1, {
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    httpRequestDuration.record(durationSec, {
      method: req.method,
      route: route,
    });

    activeRequests.add(-1, { route: req.path });
  });

  next();
});

app.get("/", (req, res)=>{
res.render("index")
})


app.listen(PORT, (err)=>{
  if(err) console.error("No working")
  console.log(`Listening on port ${PORT}`);
})
