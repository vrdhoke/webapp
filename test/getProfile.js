var expect = require('chai').expect;
// var chai = require('chai');
var app = require('../app');
// let chaiHttp = require('chai-http');
var request = require('request');
// let should = chai.should();

// chai.use(chaiHttp);
const {describe} = require('mocha');

const assert = require('assert');

before((done) => {
  server = app.listen(5000, done);
});

describe('Simple test suite:', function() {
    it('1 === 1 should be true', function() {
        assert(1 === 1);
    });
});

describe("Main page", function (done) {
  it("status", function (done) {
    request("http://localhost:5000", function (error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
});

after((done) => {
  server.close(done);
});

// const userCredentials = {
//     email: 'vaibhavdhoke1@gmail.com', 
//     password: 'Qwerty1@'
//   }
//   //now let's login the user before we run any tests
//   var authenticatedUser = request.agent(app);
//   before(function(done){
//     authenticatedUser
//       .post('/auth/login')
//       .send(userCredentials)
//       .end(function(err, response){
//         expect(response.statusCode).to.equal(302);
//         expect('Location', '/auth/home');
//         done();
//       });
//   });

//   describe('GET /profile', function(done){
//     //addresses 1st bullet point: if the user is logged in we should get a 200 status code
//       it('should return a 200 response if the user is logged in', function(done){
//         authenticatedUser.get('/auth/home')
//         .expect(200, done);
//       });
//     //addresses 2nd bullet point: if the user is not logged in we should get a 302 response code and be directed to the /login page
//       it('should return a 302 response and redirect to /login', function(done){
//         request(app).get('/auth/home')
//         .expect('Location', '/')
//         .expect(302, done);
//       });

//       // it('it should POST a User', (done) => {
//       //   let user = {
//       //       fname: "Akash",
//       //       lname: "Atnoorkar",
//       //       email: "dhoke1@gmail.com",
//       //       password: "Qwerty1@"
//       //   }
//       //     chai.request(app)
//       //     .post('/auth/register')
//       //     .send(user)
//       //     .end((err, res) => {
//       //       res.should.have.status(201);
//       //       res.text.should.be.equal('Registered Successfully');
//       //   done();
//       //     });
//       //   });
//     });

