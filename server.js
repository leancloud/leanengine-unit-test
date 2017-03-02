var express = require('express');
var morgan = require('morgan');

var app = express();

app.use(morgan('short'));

app.get('/', function(req, res) {
  return res.send('Hello');
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
