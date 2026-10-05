const fs = require('fs') 
const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      ejecutarAnalisisEstrategico = require('./chatbot'),
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

app.post("/analisis", async (req, res)=>{
  const { value } = req.body;

  if (!value) {
    res.status(400).json({ error: 'Bad Request: Missing value' });
    return;
  }

  const wantsStream = req.headers.accept && req.headers.accept.includes('text/event-stream');

  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    let fullText = '';

    try {
      await ejecutarAnalisisEstrategico.stream(value, (chunk) => {
        fullText += chunk;
        res.write(`event: chunk\ndata: ${JSON.stringify({ chunk, fullText })}\n\n`);
      });

      res.write(`event: done\ndata: ${JSON.stringify({ done: true, text: fullText })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error en el análisis stream:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Error interno del servidor' })}\n\n`);
      res.end();
    }

    return;
  }

  try {
    const resultado = await ejecutarAnalisisEstrategico(value);
    res.json({ respuesta: resultado });
  } catch (error) {
    console.error('Error en el análisis:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.listen(PORT, (err)=>{
  if(err) console.error("No working")
  console.log(`Listening on port ${PORT}`);
})
