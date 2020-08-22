'use strict';
const AV = require('leanengine');

AV.Cloud.define('hello', (req) => {
  if (req.params.name) {
    return `Hello ${req.params.name}!`;
  }
  return 'Hello world!';
});

AV.Cloud.define('time', () => {
  return new Date().toISOString();
});
