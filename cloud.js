'use strict';
var assert = require('assert');
var AV = require('leanengine');
require('should');

AV.Cloud.define('foo', function(request, response) {
  response.success('bar');
});

AV.Cloud.define('hello', function(request, response) {
  response.success({action: 'hello', name: request.params.name});
});

AV.Cloud.define('remoteAddress', (req) => {
  return req.meta.remoteAddress;
});

AV.Cloud.define('instance', function(request, response) {
  console.log('instance:', process.env.LC_APP_INSTANCE);
  response.success(process.env.LC_APP_INSTANCE);
});

AV.Cloud.define('choice', function(req, res) {
  if (req.params.choice) {
    res.success('OK~');
  } else {
    res.error('OMG...');
  }
});

AV.Cloud.define('testSuccess', function(request, response) {
  return response.success();
});

AV.Cloud.define('testError', function(request, response) {
  return response.error('errorMsg');
});

AV.Cloud.define('asyncError', function(req, res) {
  setTimeout(function() {
    return noThisMethod(); // eslint-disable-line
  }, 2000);
  return res.success();
});

AV.Cloud.define('testUser', function(req, res) {
  return res.success(req.user);
});

AV.Cloud.define('time', function(request, response) {
  return response.success(new Date());
});

AV.Cloud.define('averageStars', function(request, response) {
  var query;
  query = new AV.Query('Review');
  query.equalTo('movie', request.params.movie);
  return query.find().then(function(results) {
    var i, sum;
    sum = 0;
    i = 0;
    while (i < results.length) {
      sum += results[i].get('stars');
      ++i;
    }
    return response.success(sum / results.length);
  })
  .catch(function(_err) {
    return response.error('movie lookup failed');
  });
});

AV.Cloud.define('averageStars_CQL', function(request, response) {
  AV.Query.doCloudQuery('select stars from Review where movie = ?', [request.params.movie]).then(function(results) {
    results = results.results;
    var i, sum;
    sum = 0;
    i = 0;
    while (i < results.length) {
      sum += results[i].get('stars');
      ++i;
    }
    return response.success(sum / results.length);
  })
  .catch(function(err) {
    return response.error('movie lookup failed:' + err);
  });
});

AV.Cloud.define('getArmor', function(request, response) {
  var query;
  query = new AV.Query('Armor');
  return query.find().then(function(results) {
    if (results.length > 0) {
      return response.success(results[0]);
    }
  })
  .catch(function() {
    return response.error('movie lookup failed');
  });
});

AV.Cloud.define('getArmors', function(request, response) {
  var query;
  query = new AV.Query('Armor');
  return query.find().then(function(results) {
    return response.success(results);
  })
  .catch(function() {
    return response.error('movie lookup failed');
  });
});

AV.Cloud.define('GetSomeArmors', function(request, response) {
  var query;
  query = new AV.Query('Armor');
  query.limit(1);
  query.skip(request.params.skip);
  return query.find().then(function(results) {
    return response.success(results);
  })
  .catch(function() {
    return response.error('some error happended');
  });
});

AV.Cloud.define('login', function(req, res) {
  var username = req.params.username;
  var password = req.params.password;
  if (!username || !password) {
    var err = new Error('username or password is null');
    err.code = 1234;
    return res.error(err);
  }
  return AV.User.logIn(username, password).then(function(user) {
    return res.success(user);
  })
  .catch(function(err) {
    return res.error(err);
  });
});

AV.Cloud.beforeSave('TestBiz', function(req, res) {
  console.log('TestBiz beforeSave');
  var biz = req.object;
  if (req.user) {
    biz.set('beforeSaveUsername', req.user.get('username'));
  }
  biz.set('beforeSave', true);
  if(req.user && req.user.get('username') === 'unluckily') {
    return res.error();
  }
  return res.success();
});

AV.Cloud.afterSave('TestBiz', function(req) {
  var biz, currentUser;
  console.log('TestBiz afterSave');
  biz = req.object;
  if (req.user) {
    biz.set('afterSaveUsername', req.user.get('username'));
  }
  biz.set('afterSave', true);
  currentUser = AV.User.current();
  console.log('currentUser:', currentUser);
  console.log('req.user:', req.user);
  return biz.save().catch((err) => {
    console.log(err);
    return assert.ifError(err);
  });
});

AV.Cloud.afterUpdate('TestBiz', function(req) {
  var biz;
  console.log('TestBiz afterUpdate', req);
  biz = req.object;
  if (req.user) {
    biz.set('afterUpdateUsername', req.user.get('username'));
  }
  biz.set('afterUpdate', true);
  return biz.save().catch((err) => {
    console.log(err);
    return assert.ifError(err);
  });
});

AV.Cloud.beforeDelete('TestBiz', function(req, res) {
  var _ref;
  console.log('TestBiz beforeDelete');
  if (((_ref = req.user) != null ? _ref.get('username') : void 0) === 'unluckily') {
    return res.error();
  }
  return res.success();
});

AV.Cloud.onLogin(function(request, response) {
  console.log('on login:', request.object);
  if (request.object.get('username') === 'noLogin') {
    return response.error('Forbidden');
  } else {
    return response.success();
  }
});

var DeleteBiz = AV.Object.extend('DeleteBiz');

AV.Cloud.afterDelete('TestBiz', function(req) {
  var deleteBiz;
  console.log('TestBiz afterDelete');
  deleteBiz = new DeleteBiz();
  deleteBiz.set('oriId', req.object.id);
  deleteBiz.set('raw', JSON.stringify(req.object));
  if (req.user) {
    deleteBiz.set('afterDeleteUsername', req.user.get('username'));
  }
  deleteBiz.set('afterDelete', true);
  return deleteBiz.save().catch((err) => {
    console.log(err);
    return assert.ifError(err);
  });
});

AV.Cloud.define('status.topic', function(request, response) {
  return response.success('Hello world!');
});

AV.Cloud.define('getRandomTestItem', function(request, response) {
  var query;
  query = new AV.Query('TestItem');
  return query.count().then(function(count) {
    query.skip(Math.round(Math.random() * count));
    query.limit(1);
    return query.find();
  })
  .then(function(results) {
    return response.success(results[0]);
  })
  .catch(function(_error) {
    return response.error('movie lookup failed');
  });
});

var ComplexObject = AV.Object.extend('ComplexObject');

AV.Cloud.define('complexObject', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find().then(function(results) {
    response.success({
      foo: 'bar',
      i: 123,
      obj: {
        a: 'b',
        as: [1, 2, 3]
      },
      t: new Date('2015-05-14T09:21:18.273Z'),
      avObject: results[0],
      avObjects: results
    });
  });
});

AV.Cloud.define('bareAVObject', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find().then(function(results) {
    response.success(results[0]);
  });
});

AV.Cloud.define('AVObjects', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find().then(function(results) {
    response.success(results);
  });
});

AV.Cloud.define('testAVObjectParams', function(request, response) {
  request.params.avObject.should.be['instanceof'](AV.Object);
  request.params.avObject.get('name').should.be.equal('avObject');
  request.params.avObject.get('pointerColumn').should.be['instanceof'](AV.User);
  request.params.avFile.should.be['instanceof'](AV.File);
  request.params.avObjects.forEach(function(object) {
    object.should.be['instanceof'](AV.Object);
    object.get('name').should.be.equal('avObjects');
  });
  response.success();
});

AV.Cloud.define('testBareAVObjectParams', function(request, response) {
  request.params.should.be['instanceof'](AV.Object);
  request.params.get('name').should.be.equal('avObject');
  request.params.get('avFile').should.be['instanceof'](AV.File);
  response.success();
});

AV.Cloud.define('testAVObjectsArrayParams', function(request, response) {
  request.params.forEach(function(object) {
    object.get('name').should.be.equal('avObject');
    object.get('avFile').should.be['instanceof'](AV.File);
  });
  response.success();
});

AV.Cloud.define('testRun', function(request, response) {
  AV.Cloud.run('hello', {name: '李四'}).then(function(data) {
    assert.deepEqual(data, {action: 'hello', name: '李四'});
    response.success();
  });
});

AV.Cloud.define('testRun_options_callback', function(request, response) {
  AV.Cloud.run('choice', {choice: true}).then(function(data) {
    assert.equal('OK~', data);
    AV.Cloud.run('choice', {choice: false}, {
      success: function(data) {
        assert.ifError(data);
      },
      error: function(err) {
        assert.equal('OMG...', err);
        response.success();
      }
    });
  })
  .catch(function(err) {
    assert.ifError(err);
  });
});

AV.Cloud.define('testRun_promise', function(request, response) {
  AV.Cloud.run('choice', {choice: true}).then(function(data) {
    assert.equal('OK~', data);
    AV.Cloud.run('choice', {choice: false}).then(function(data) {
      assert.ifError(data);
    }, function(err) {
      assert.equal('OMG...', err);
      response.success();
    });
  },
  function(err) {
    assert.ifError(err);
  });
});

AV.Cloud.define('testRunWithUser', function(request, response) {
  AV.Cloud.run('testUser', {}).then(function(data) {
    assert.equal('ok', data);
    response.success();
  });
});

AV.Cloud.define('testRunWithAVObject', function(request, response) {
  AV.Cloud.run('complexObject', {}).then(function(datas) {
    response.success(datas);
  });
});

AV.Cloud.onVerified('sms', function(request) {
  assert.equal(request.object.className, '_User');
  assert.equal(request.object.id, '54fd6a03e4b06c41e00b1f40');
  assert.equal(request.object.get('username'), 'admin');
});

AV.Cloud.define('requestPasswordResetBySmsCode', function (request, response) {
  var phone = request.params.phone;
  if(!phone){
    return response.error('phone 不能为空');
  }
  AV.User.requestPasswordResetBySmsCode(phone,{useMasterKey: true})
  .then(function (success) {
    return response.success(success);
  }, function (error) {
    return response.error(error);
  });
});

AV.Cloud.define('testThrowError', function(request, response) {
  noThisMethod(); // eslint-disable-line
  response.success();
});

AV.Cloud.beforeSave('HookReliabilityTest', (req, res) => {
  req.object.set('beforeSave', true);
  res.success();
});

AV.Cloud.afterSave('HookReliabilityTest', (req) => {
  req.object.set('afterSave', true);
  req.object.save().catch((err) => {
    console.error('HookReliabilityTest afterSave err:', err);
  });
});

AV.Cloud.beforeSave('IgnoreHookTest', function(request, response) {
  console.log('IgnoreHookTest', 'beforeSave', request.object.id);
  request.object.set('byBeforeSave', 1);
  response.success();
});

AV.Cloud.afterSave('IgnoreHookTest', function(request) {
  console.log('IgnoreHookTest', 'afterSave', request.object.id);
  request.object.set('byAfterSave', 1);
  request.object.disableBeforeHook();
  request.object.save().catch(console.error);
});

AV.Cloud.beforeUpdate('IgnoreHookTest', function(request, response) {
  console.log('IgnoreHookTest', 'beforeUpdate', request.object.id);
  request.object.set('byBeforeUpdate', 1);
  request.object.disableAfterHook();
  request.object.save().catch(console.error).then(function() {
    response.success();
  });
});

AV.Cloud.afterUpdate('IgnoreHookTest', function(request) {
  console.log('IgnoreHookTest', 'afterUpdate', request.object.id);
  request.object.set('byAfterUpdate', 1);
  request.object.disableBeforeHook();
  request.object.save().catch(console.error);
});

AV.Cloud.beforeDelete('IgnoreHookTest', function(request, response) {
  console.log('IgnoreHookTest', 'beforeDelete', request.object.id);
  response.error('Error from beforeDelete');
});

AV.Cloud.afterDelete('IgnoreHookTest', function(request) {
  console.log('IgnoreHookTest', 'afterDelete', request.object.id);
});

module.exports = AV.Cloud;
