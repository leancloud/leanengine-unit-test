//
// 多实例发现工具
//
// 使用存储服务实现 LeanCloud App 下云引擎实例相互发现，用于多实例协同工作。
//
const debug = require('debug')('node-discovery');
const uniqid = require('uniqid');
const AV = require('leancloud-storage');

const HEART_BEAT_DELAY = 1000 * 60;

const uniqId = uniqid();

const node = new AV.Object('NodeHeartBeat');
node.save({uniqId, ACL: {}}).then(() => {
  debug('Node [%s] registered.', uniqId);
});

const intervalID = setInterval(() => {
  node.save(null, {useMasterKey: true});
}, HEART_BEAT_DELAY);

exports.getAliveNodes = () => {
  return new AV.Query('NodeHeartBeat')
    .greaterThanOrEqualTo('updatedAt', new Date(new Date().getTime() - HEART_BEAT_DELAY * 3))
    .doesNotExist('shutdownAt')
    .find({useMasterKey: true});
};

exports.exit = () => {
  return node.save({shutdownAt: new Date()}, {useMasterKey: true})
    .then(() => {
      clearInterval(intervalID);
      debug('Node [%s] exited.');
    });
};

