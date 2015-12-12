var domain = require('domain');

var d = domain.create();
d.on('error', function(e) {
  console.log('error');
});
console.log('1>', process.domain);
d.run(function() {
  console.log('2>', process.domain);
  var a = Promise.resolve().then(function() {
    console.log('3>', domain._stack);
  });
});
