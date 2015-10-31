'use strict';
/* globals describe, it */
var request = require('supertest'),
  should = require('should');

var app;
var nodeEnv = process.env.NODE_ENV;
if(!nodeEnv || nodeEnv === 'development') {
  var AV = require('leanengine');
  var APP_ID = '4h2h4okwiyn8b6cle0oig00vitayum8ephrlsvg7xo8o19ne';
  var APP_KEY = '3xjj1qw91cr3ygjq9lt0g8c3qpet38rrxtwmmp0yffyoy2t4';
  var MASTER_KEY = '3v7z633lzfec9qzx8sjql6zimvdpmtwypcchr2gelu5mrzb0';
  AV.initialize(APP_ID, APP_KEY, MASTER_KEY);
  app = require('../app');
}

describe('webHosting', function() {
  it('ejs rander', function(done) {
    request(app)
      .get('/hello')
      .expect(200)
      .expect("Congrats, you just set up your app!\n", done);
  });

  it('post request', function(done) {
    request(app)
      .post('/hello')
      .send({name: 'Tom'})
      .expect(200)
      .expect("hello, Tom\n", done);
  });

  it("Should return profile.", function(done) {
    this.timeout(20000);
    return request(app).get("/profile").expect(200, function(err, res) {
      should.not.exist(err);
      res.body.should.eql({});
      return request(app).post("/login").send({
        username: "admin",
        password: "admin"
      }).expect(302, function(err, res) {
        should.not.exist(err);
        res.headers.location.should.equal('/profile');
        res.headers['set-cookie'][0].indexOf('avos:sess=eyJfdWlkIjoiNTRmZDZhMDNlNGIwNmM0MWUwMGIxZjQwIiwiX3Nlc3Npb25Ub2tlbiI6IncyanJ0a2JlaHAzOG90cW1oYnF1N3liczkifQ==; path=/; expires=').should.equal(0);
        res.headers['set-cookie'][1].indexOf('avos:sess.sig=jMYF3Iwhmw903-K1K12MVdAFOh0; path=/; expires=').should.equal(0);
        return request(app).get("/profile")
          .set('Cookie', 'avos:sess=eyJfdWlkIjoiNTRmZDZhMDNlNGIwNmM0MWUwMGIxZjQwIiwiX3Nlc3Npb25Ub2tlbiI6IncyanJ0a2JlaHAzOG90cW1oYnF1N3liczkifQ==; avos:sess.sig=jMYF3Iwhmw903-K1K12MVdAFOh0')
          .expect(200, function(err, res) {
            should.not.exist(err);
            should.exist(res.body.objectId);
            return request(app).get("/logout").expect(302, function(err, res) {
              if (err) {
                throw err;
              }
              res.headers['set-cookie'][0].indexOf('avos:sess=; path=/; expires=').should.equal(0);
              res.headers.location.should.equal('/profile');
              return request(app).get("/profile").set('Cookie', 'avos:sess=; avos:sess.sig=qRTO8CJG5Ccg4ZftDVoGbuhUH90').expect(200).expect({}, done);
            });
          });
      });
    });
  });

  it("test cookie session", function(done) {
    this.timeout(20000);
    return request(app).post("/testCookieSession")
      .send({
        username: 'admin',
        password: 'admin'
      }).expect(200, done);
  });

});

