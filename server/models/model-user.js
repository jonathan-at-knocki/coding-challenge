//  the model for a user

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
  salt: { type: String, required: true }
});

//  from http://stackoverflow.com/a/46181
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line no-useless-escape
  return re.test(email);
}

//  encode password. returns obj {salt, hash}
function encodePassword(password) {
  var obj = {};
  obj.salt = crypto.randomBytes(20).toString('hex');
  obj.hash =
    crypto.pbkdf2Sync(password, obj.salt, 100000, 512, 'sha512')
    .toString('hex');
  return obj;
}

//  create a new user. on success, call callback(user)
userSchema.statics.createUser = function createUser(
  email, password, errback, callback) {
  var callErrback = msg => errback(new Error(msg));

  // validate that we have an email and password
  if (!(email && password)) {
    callErrback('Cannot have blank e-mail or password');
  } else if (!validateEmail(email)) {
    callErrback('Bad email: ' + email);
  } else {
    // check for existing user
    this.findOne({ email }, (err, user) => {
      // userObj used below
      var userObj;

      if (err) {
        callErrback('Error searching for email: ' + err);
      } else if (!user) {
        // user not found. add him
        userObj = encodePassword(password);
        userObj.email = email;
        this.create(userObj, (err, user) => {
          if (err) {
            callErrback('Error adding user: ' + err);
            return;
          }
          // all good
          callback(user);
        });
      } else {
        // email exists already
        callErrback('Email already exists in db');
      }
    });
  }
};

mongoose.model('User', userSchema);
