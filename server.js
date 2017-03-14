var express = require('express');
var morgan = require('morgan');
var assert = require('assert')

assert.equal('2.1.12', require('mime-types/package.json').version)

var app = express();

app.use(morgan('short'));

app.get('/', function(req, res) {
  return res.send('Hello');
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
