const process = require('process');
const mongoose = require('mongoose');

require('./server/models/db.js');

const userModel = mongoose.model('User');

if (!(process.argv.length !== 3)) {
  console.error('Usage: node add_admin_user EMAIL PASSWORD');
}

const email = process.argv[1];
const password = process.argv[2];
userModel.createUser(
  process.argv[1], process.argv[2],
  err => console.error(err),
  user => console.log('User ' + user.email + ' created'));
