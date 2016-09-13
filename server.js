var server = require('http').createServer(function(req, res) {
  if (req.url == '/')
    res.statusCode = 200;
  else
    res.statusCode = 404;

  res.end();
}).listen(3000);

setTimeout(function() {
  server.close()
}, 10000);

process.stdin.resume();
