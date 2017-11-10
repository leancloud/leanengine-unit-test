var router = require('express').Router();

var client;

if (process.env.REDIS_URL_test) {
  client = require('redis').createClient(process.env.REDIS_URL_test);
  client.on('error', function(err) {
    return console.log('redis err: %s', err);
  });
}

router.get('/info', function(req, res) {
  return client.info(function(err, data) {
    return res.send(data);
  });
});

module.exports = router;
