'use strict';
var fs = require('fs');
var assert = require('assert');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session')
var request = require('request');
var bluebird = require('bluebird');
var AV = require('leanengine');
var sniper = require('leanengine-sniper');
var _ = require('underscore');

var todos = require('./routes/todos');

// 加载云函数定义
require('./cloud');

var client;

if (process.env.REDIS_URL_test) {
  client = require('redis').createClient(process.env.REDIS_URL_test);
  client.on('error', function(err) {
    return console.log('redis err: %s', err);
  });
}

console.log('instance:', process.env.LC_APP_INSTANCE);

var app = express();
app.use(sniper({AV: AV}));

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 加载云引擎中间件
app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('trust proxy', 1)

var sess = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: true}
}
app.use(session(sess))

// 加载 cookieSession 以支持 AV.User 的会话状态
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));

app.use(AV.Cloud.HttpsRedirect());

app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});

// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

// ejs 模版渲染
app.get('/hello', function(req, res) {
  res.render('hello', {
    message: 'Congrats, you just set up your app!'
  });
});

app.post('/hello', function(req, res) {
  res.render('hello', {
    message: 'hello, ' + req.body.name
  });
});

app.get('/instance', function(req, res) {
  // 测试各个节点日志收集的有效性
  console.log('instance:', process.env.LC_APP_INSTANCE);
  res.send(process.env.LC_APP_INSTANCE);
});

app.get('/clientRequestHeaders', (req, res) => {
  res.send(req.headers)
})

app.get('/logTest', function(req, res) {
  for(var i = 0; i < 1000; i++) {
    console.log('logTest ...', i);
  }
  res.send('ok');
});

app.get('/time', function(req, res) {
  res.send(new Date());
});

app.get('/session', function(req, res, next) {
  var sess = req.session
  if (sess.views) {
    sess.views++
      res.setHeader('Content-Type', 'text/html')
      res.write('<p>views: ' + sess.views + '</p>')
      res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>')
      res.end()
  } else {
    sess.views = 1
    res.end('welcome to the session demo. refresh!')
  }
})

app.post('/login', function(req, res) {
  AV.User.logIn(req.body.username, req.body.password).then(function() {
    res.redirect('/profile');
  }, function(error) {
    res.status = 500;
    res.send(error);
  });
});

app.get('/logout', function(req, res) {
  AV.User.logOut();
  res.redirect('/profile');
});

app.get('/profile', function(req, res) {
  if (req.AV.user) {
    res.send(req.AV.user);
  } else {
    res.send({});
  }
});

app.post('/testCookieSession', function(req, res) {
  AV.User.logIn(req.body.username, req.body.password).then(function(user) {
    assert.equal(req.body.username, user.get('username'));
    assert.equal(AV.User.current(), user);
    AV.User.logOut();
    assert(!AV.User.current());
    // 登出再登入不会有问题
    return AV.User.logIn(req.body.username, req.body.password);
  }).then(function(user) {
    assert.equal(AV.User.current(), user);
    // 在已登录状态，直接用另外一个账户登录
    return AV.User.logIn('zhangsan', 'zhangsan');
  }).then(function(user) {
    assert.equal('zhangsan', user.get('username'));
    assert.equal(AV.User.current(), user);
    res.send('ok');
  }, function(err) {
    assert.ifError(err);
  });
});

app.get('/sources', function(req, res) {
  fs.readdir('.', function(err, data) {
    res.send(data);
  });
});

app.get('/path', function(req, res) {
  res.send({
    '__filename': __filename,
    '__dirname': __dirname
  });
});

app.get('/runCool', function(req, res) {
  AV.Cloud.run('cool', {
    name: 'dennis'
  }, {
    success: function(result) {
      res.send(result);
    },
    error: function(err) {
      res.send(err);
    }
  });
});

app.get('/redis/info', function(req, res, next) {
  return client.info(function(err, data) {
    return res.send(data);
  });
});

app.get('/throwError', function(req, res) {
  noThisMethod(); // jshint ignore:line
});

app.get('/host', function(req, res) {
  res.send(req.get('host'));
});

app.get('/asyncError', function(req, res) {
  setTimeout(function() {
    return noThisMethod(); // jshint ignore:line
  }, 2000);
  return res.send('ok');
});

app.get('/staticMiddlewareTest.html', function(req, res) {
  res.send('dynamic resource');
});

var TestObject = AV.Object.extend('TestObject');
app.get('/userMatching', function(req, res) {
  setTimeout((function() {
    var query;
    query = new AV.Query(TestObject);
    query.get('54b625b7e4b020bb5129fe04', {
      success: function(obj) {
        res.send({
          reqUser: req.AV.user,
          currentUser: AV.User.current()
        });
      },
      error: function(err) {
        res.success({
          reqUser: req.user,
          currentUser: AV.User.current()
        });
      }
    });
  }), Math.floor(Math.random() * 2000 + 1));
});

app.post('/callSelf', function(req, res, next) {
  if (!req.body.headers) {
    req.body.headers = {};
  }
  req.body.headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'];
  request({
    url: ('http://127.0.0.1:' + process.env.LC_APP_PORT || 3000) + req.body.path,
    method: req.body.method || 'GET',
    headers: req.body.headers,
    body: req.body.body
  }, function(err, response, body) {
    if (err) {
      return next(err);
    }
    res.status(response.statusCode).send(body);
  });
});

app.post('/hookReliabilityTest', function(req, res, next) {
  bluebird.map(_.range(req.body.count || 10000), () => {
    return new AV.Object('HookReliabilityTest').save({ foo: 'bar' })
  }, { concurrency: 20 }).then(() => {
    res.send('ok');
  }).catch((err) => {
    next(err);
  });
});

app.post('/hookReliabilityTest2', function(req, res, next) {
  bluebird.each(_.range(req.body.times || 10), () => {
    let i;
    let objs = [];
    for(i = 0; i < 200; i++) {
      let obj = new AV.Object('HookReliabilityTest');
      obj.set('foo', 'bar');
      objs.push(obj);
    }
    return AV.Object.saveAll(objs);
  }).then(() => {
    res.send('ok');
  }).catch((err) => {
    next(err);
  });
});

// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) { // jshint ignore:line
    var statusCode = err.status || 500;
    if(statusCode === 500) {
      console.error(err.stack || err);
    }
    res.status(statusCode);
    res.render('error', {
      message: err.message || err,
      error: err
    });
  });
}

// 如果是非开发环境，则页面只输出简单的错误信息
app.use(function(err, req, res, next) { // jshint ignore:line
  res.status(err.status || 500);
  res.render('error', {
    message: err.message || err,
    error: {}
  });
});

module.exports = app;
