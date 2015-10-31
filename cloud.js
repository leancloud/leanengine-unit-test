'use strict';
var assert = require('assert');
var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request, response) {
  response.success('Hello world!');
});

AV.Cloud.define("testSuccess", function(request, response) {
  return response.success();
});

AV.Cloud.define("testError", function(request, response) {
  return response.error("errorMsg");
});

AV.Cloud.define('throwError', function(req, res) {
  noThisMethod(); // jshint ignore:line
  return res.success();
});

AV.Cloud.define('asyncError', function(req, res) {
  setTimeout(function() {
    return noThisMethod(); // jshint ignore:line
  }, 2000);
  return res.success();
});

AV.Cloud.define('testUser', function(req, res) {
  return res.success(req.user);
});

AV.Cloud.define("time", function(request, response) {
  return response.success(new Date());
});

AV.Cloud.define("averageStars", function(request, response) {
  var query;
  query = new AV.Query("Review");
  query.equalTo("movie", request.params.movie);
  return query.find({
    success: function(results) {
      var i, sum;
      sum = 0;
      i = 0;
      while (i < results.length) {
        sum += results[i].get("stars");
        ++i;
      }
      return response.success(sum / results.length);
    },
    error: function() {
      return response.error("movie lookup failed");
    }
  });
});

AV.Cloud.define("getArmor", function(request, response) {
  var query;
  query = new AV.Query("Armor");
  return query.find({
    success: function(results) {
      if (results.length > 0) {
        return response.success(results[0]);
      }
    },
    error: function() {
      return response.error("movie lookup failed");
    }
  });
});

AV.Cloud.define("getArmors", function(request, response) {
  var query;
  query = new AV.Query("Armor");
  return query.find({
    success: function(results) {
      return response.success(results);
    },
    error: function() {
      return response.error("movie lookup failed");
    }
  });
});

AV.Cloud.define("GetSomeArmors", function(request, response) {
  var query;
  query = new AV.Query("Armor");
  query.limit(1);
  query.skip(request.params.skip);
  return query.find({
    success: function(results) {
      return response.success(results);
    },
    error: function() {
      return response.error("some error happended");
    }
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
  return AV.User.logIn(username, password, {
    success: function(user) {
      return res.success(user);
    },
    error: function(user, err) {
      return res.error(err);
    }
  });
});

AV.Cloud.beforeSave('TestBiz', function(req, res) {
  var biz, _ref;
  console.log('TestBiz beforeSave');
  biz = req.object;
  if (req.user) {
    biz.set('beforeSaveUsername', req.user.get('username'));
  }
  biz.set('beforeSave', true);
  if (((_ref = req.user) != null ? _ref.get('username') : void 0) === 'unluckily') {
    return res.error();
  }
  return res.success();
});

AV.Cloud.beforeSave('TestObject', function(req, res) {
  console.log('TestObject beforeSave');
  return res.success();
});

AV.Cloud.afterSave('TestBiz', function(req) {
  var biz, currentUser;
  console.log('TestBiz afterSave');
  biz = req.object;
  console.log('>>', biz);
  if (req.user) {
    biz.set('afterSaveUsername', req.user.get('username'));
  }
  biz.set('afterSave', true);
  currentUser = AV.User.current();
  console.log('currentUser:', currentUser);
  console.log('req.user:', req.user);
  return biz.save({
    error: function(obj, err) {
      console.log(err);
      return assert.ifError(err);
    }
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
  return biz.save({
    error: function(obj, err) {
      console.log(err);
      return assert.ifError(err);
    }
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

AV.Cloud.onVerified('sms', function(request) {
  return console.log("onVerified: sms, user: " + request.object);
});

AV.Cloud.onLogin(function(request, response) {
  console.log("on login:", request.object);
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
  return deleteBiz.save({
    error: function(obj, err) {
      console.log(err);
      return assert.ifError(err);
    }
  });
});

AV.Cloud.define('status.topic', function(request, response) {
  return response.success('Hello world!');
});

AV.Cloud.define("getRandomTestItem", function(request, response) {
  var query;
  query = new AV.Query("TestItem");
  return query.count({
    success: function(count) {
      query.skip(Math.round(Math.random() * count));
      query.limit(1);
      return query.find({
        success: function(results) {
          return response.success(results[0]);
        },
        error: function(error) {
          return response.error("movie lookup failed");
        }
      });
    },
    error: function(error) {
      return response.error("movie lookup failed");
    }
  });
});

var ComplexObject = AV.Object.extend('ComplexObject');

AV.Cloud.define('complexObject', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
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
    }
  });
});

AV.Cloud.define('bareAVObject', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
      response.success(results[0]);
    }
  });
});

AV.Cloud.define('AVObjects', function(request, response) {
  var query;
  query = new AV.Query(ComplexObject);
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
      response.success(results);
    }
  });
});

AV.Cloud.define('testAVObjectParams', function(request, response) {
  request.params.avObject.should.be["instanceof"](AV.Object);
  request.params.avObject.get('name').should.be.equal('avObject');
  request.params.avObject.get('pointerColumn').should.be["instanceof"](AV.User);
  request.params.avFile.should.be["instanceof"](AV.File);
  request.params.avObjects.forEach(function(object) {
    object.should.be["instanceof"](AV.Object);
    object.get('name').should.be.equal('avObjects');
  });
  response.success();
});

AV.Cloud.define('testBareAVObjectParams', function(request, response) {
  request.params.should.be["instanceof"](AV.Object);
  request.params.get('name').should.be.equal('avObject');
  request.params.get('avFile').should.be["instanceof"](AV.File);
  request.params.get('avFile').name().should.be.equal('hello.txt');
  response.success();
});

AV.Cloud.define('testAVObjectsArrayParams', function(request, response) {
  request.params.forEach(function(object) {
    object.get('name').should.be.equal('avObject');
    object.get('avFile').should.be["instanceof"](AV.File);
    object.get('avFile').name().should.be.equal('hello.txt');
  });
  response.success();
});

module.exports = AV.Cloud;
