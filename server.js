'use strict';

var AV = require('leanengine');

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});

var app = require('./app');

// 端口一定要从环境变量 `LEANCLOUD_APP_PORT` 中获取。
// LeanEngine 运行时会分配端口并赋值到该变量。
var PORT = parseInt(process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000);

const server = app.listen(PORT, function (err) {
  if (err) {
    console.error(`Node app listen port ${PORT} err:`, err);
    return;
  }

  console.log('Node app is running on port:', PORT);

  // 注册全局未捕获异常处理器
  process.on('uncaughtException', function(err) {
    console.error('Caught exception:', err.stack);
  });
  process.on('unhandledRejection', function(reason, p) {
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason.stack);
  });
});

const nodeDiscovery = require('./node-discovery');
const cpuBurner = require('./cpu-burner');
const redis = require('./redis');

const cpuUsageMock = require('./multi-nodes-cpuusage-mock');

const exitHandler = () => {
  server.close();

  cpuUsageMock.exit();

  nodeDiscovery.exit();
  cpuBurner.exit();
  redis.exit();
};

process.on('SIGTERM', exitHandler);
process.on('SIGINT', exitHandler);
