var fs = require('fs');
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var request = require('request');
var bluebird = require('bluebird');
const cpuUsageMock = require('./multi-nodes-cpuusage-mock');

var AV = require('leanengine');
//var apm = require('leanengine-apm');
var _ = require('underscore');

// 加载云函数定义
require('./cloud');

console.log('instance:', process.env.LC_APP_INSTANCE);

//apm.init(process.env.LEANENGINE_APM_TOKEN);

var app = express();
//app.use(require('leanengine-apm').express());

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sess = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: true}
};
app.use(session(sess));

// 加载 cookieSession 以支持 AV.User 的会话状态
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));

app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});

// 可以将一类的路由单独保存在一个文件中
app.use('/todos', require('./routes/todos'));
app.use('/redis', require('./routes/redis'));

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
  res.send(req.headers);
});

app.get('/logTest', function(req, res) {
  for(var i = 0; i < 1000; i++) {
    console.log('logTest ...', i);
  }
  res.send('ok');
});

app.get('/time', function(req, res) {
  res.send(new Date());
});

app.get('/session', function(req, res) {
  var sess = req.session;
  if (sess.views) {
    sess.views++;
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>views: ' + sess.views + '</p>');
    res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>');
    res.end();
  } else {
    sess.views = 1;
    res.end('welcome to the session demo. refresh!');
  }
});

// 处理登录请求（可能来自登录界面中的表单）
app.post('/login', function(req, res) {
  AV.User.logIn(req.body.username, req.body.password).then(function(user) {
    res.saveCurrentUser(user); // 保存当前用户到 Cookie
    res.redirect('/profile'); // 跳转到个人资料页面
  }, function(_error) {
    //登录失败，跳转到登录页面
    res.redirect('/login');
  });
});

// 查看个人资料
app.get('/profile', function(req, res) {
  // 判断用户是否已经登录
  if (req.currentUser) {
    // 如果已经登录，发送当前登录用户信息。
    res.send(req.currentUser);
  } else {
    // 没有登录，跳转到登录页面。
    res.redirect('/login');
  }
});

// 登出账号
app.get('/logout', function(req, res) {
  req.currentUser.logOut();
  res.clearCurrentUser(); // 从 Cookie 中删除用户
  res.redirect('/profile');
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

app.get('/runHello', function(req, res) {
  AV.Cloud.run('hello', {
    name: 'dennis'
  })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.get('/throwError', function() {
  noThisMethod(); // eslint-disable-line
});

app.get('/host', function(req, res) {
  res.send(req.get('host'));
});

app.get('/asyncError', function(req, res) {
  setTimeout(function() {
    return noThisMethod(); // eslint-disable-line
  }, 2000);
  return res.send('ok');
});

app.get('/staticMiddlewareTest.html', function(req, res) {
  res.send('dynamic resource');
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
    return new AV.Object('HookReliabilityTest').save({ foo: 'bar' });
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

app.post('/multi-nodes-cpuusage-mock', (req, res) => {
  cpuUsageMock.setMaxCpuUsage(req.body.percentage);
  res.send('OK');
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
  app.use(function(err, req, res, _next) {
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
app.use(function(err, req, res, _next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message || err,
    error: {}
  });
});

module.exports = app;
