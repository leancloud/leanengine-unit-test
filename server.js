var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.listen(process.env.LEANCLOUD_APP_PORT, function() {
  console.log(`hello, Node 4.x`);
});
