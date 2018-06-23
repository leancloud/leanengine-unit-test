//
// 一个多实例，按正弦曲线消耗 CPU 的工具
//
// 给定最大 CPU 消耗百分比，将会按天为周期，CPU 消耗结果为正弦曲线。
// CPU 负载每分钟调整一次。支持多实例共同运行。
//
const debug = require('debug')('multi-nodes-cpuusage-mock');
const nodeDiscovery = require('./node-discovery');
const cpuBurner = require('./cpu-burner');

let timeoutId;
let currentPercentage = 10;

exports.setMaxCpuUsage = (percentage) => {
  debug('Set max cpuUsage: %d %', percentage);
  currentPercentage = percentage;
};

// 每分钟执行一次，将 CPU 使用率画成一个正弦曲线
const asyncLoop = () => {
  const minutesOfDay = new Date().getTime() % (1000 * 60 * 60 * 24) / (1000 * 60);
  const cpuUsage = currentPercentage * Math.sin(2 * Math.PI / (60 * 24) * minutesOfDay) + currentPercentage;
  nodeDiscovery.getAliveNodes()
    .then(nodes => {
      const cpuUsagePreNode = cpuUsage / nodes.length;
      debug('Max cpuUsage: %d, total cpuUsage: %d, aliveNodes: %d, cpuUsagePreNode: %d', currentPercentage, cpuUsage, nodes.length, cpuUsagePreNode);
      cpuBurner.update(cpuUsagePreNode > 100 ? 100 : cpuUsagePreNode);
    });

  timeoutId = setTimeout(() => {
    asyncLoop();
  }, 60 * 1000 - new Date().getTime() % (60 * 1000));
};

exports.exit = () => {
  clearTimeout(timeoutId);
};

asyncLoop();
