//
// CPU 消耗工具
//
// 根据指定百分比消耗 CPU，每秒刷新一次，不阻塞事件队列。
//
const debug = require('debug')('cpu-burner');

const fibonacci = (n) => {
  if (n < 2)
    return 1;
  else
    return fibonacci(n-2) + fibonacci(n-1);
};

const fn = fibonacci;
const args = [20];
let tps = null;
let currentPercentage = 0;
let timeoutId = null;

exports.update = (percentage = 0) => {
  if (percentage > 100) {
    throw new Error('Percentage must be less or equal to 100.');
  }

  if (percentage < 0) {
    throw new Error('Percentage must be greater or equal to 0.');
  }

  currentPercentage = percentage;
  if (!tps) {
    init();
  }
};

exports.getPercentage = () => {
  return currentPercentage;
};

// 计算当前进程可以使用的 CPU 能力，并开始消耗 CPU
const init = () => {
  debug('Cpu burner init...');
  const times = 100000;
  const start = new Date();
  return compute(fn, args, times)
    .then(() => {
      tps = parseInt(times / (new Date() - start) * 1000);
      debug('Compute %s(%o) TPS: %d', fn.name, args, tps);
      burn();
    });
};

const burn = () => {
  const innerFn = () => {
    compute(fn, args, tps * currentPercentage / 100);
    timeoutId = setTimeout(() => {
      innerFn();
    }, 1000 - new Date().getTime() % 1000);
  };
  innerFn();
};

const compute = (fn, args, times) => {
  if (times <= 0) {
    return;
  }

  fn(...args);
  return Promise.resolve().then(() => {
    return compute(fn, args, times - 1);
  });
};

exports.exit = () => {
  clearTimeout(timeoutId);
  debug('Cpu burner exited.');
};
