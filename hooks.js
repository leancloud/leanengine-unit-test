'use strict';
const AV = require('leanengine');

AV.Cloud.afterSave("_User", (req) => {
  const newUser = req.object;
  console.log(`New user: ${newUser.get('username')}`);
});
