const process = require('process');
const mongoose = require('mongoose');

require('./server/models/db.js');

const userModel = mongoose.model('User');

// from http://stackoverflow.com/a/46181
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line no-useless-escape
  return re.test(email);
}

const email = process.argv[1];
const password = process.argv[2];

if (!(process.argv.length === 3 && validateEmail(email) && password)) {
  console.error('Usage: node add_admin_user EMAIL PASSWORD');
}

// first check for existing user
userModel.findOne({ email }, (err, user) => {
  if (err) {
    console.error('Error searching for email: ' + err);
  } else if (!user) {
    // user not found. add him
    userModel.create({ email }, (err, user) => {
      if (err) {
        console.error('Error adding user: ' + err);
        return;
      }
      user.setPassword(password);
      user.save((err) => {
        if (err) {
          console.error('Error saving user password: ' + err);
          return;
        }
        // all good
        console.log('User added successfully');
      });
    });
  } else {
    // email exists already
    console.error('Email already exists in db');
  }
});
