let client;

if (process.env.REDIS_URL_test) {
  client = require('redis').createClient(process.env.REDIS_URL_test);
  client.on('error', function(err) {
    return console.log('redis err: %s', err);
  });
}

exports.getClient = () => {
  if (client) {
    return client;
  }

  throw new Error('No var REDIS_URL_test in environment.');
};

exports.exit = () => {
  if (client) {
    client.quit();
  }
};
