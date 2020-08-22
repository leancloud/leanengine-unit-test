'use strict';
const AV = require('leanengine');

require('./cloud-functions');
require('./hooks');

AV.Cloud.start();
