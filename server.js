require('http').createServer(function(req, res) {
  if (req.url == '/')
    res.statusCode = 200;
  else
    res.statusCode = 500;

  res.end();
}).listen(3000);
