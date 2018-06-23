var router = require('express').Router();

const redis = require('./redis');

router.get('/info', function(req, res) {
  return redis.getClient().info(function(err, data) {
    return res.send(data);
  });
});

module.exports = router;
