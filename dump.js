var fs = require('fs');
var router = require('express').Router();
var heapdump = require('heapdump');
var AV = require('leanengine');

router.post('/snapshot', function(req, res, next) {
  var name = 'dump_' + Date.now() + '.heapsnapshot';
  heapdump.writeSnapshot('/tmp/' + name, function(err, filename) {
    if(err) {
      return next(err);
    }
    fs.readFile(filename, function(err, data) {
      if(err) {
        return next(err);
      }
      var theFile = new AV.File(name, {base64: data.toString('base64')});
        theFile.save().then(function(theFile){
          res.send('dump written to _File, name: ' + name);
        }, function(err) {
          if(err) {
            return next(err);
          }
        });
    });
  });
});

module.exports = router;
