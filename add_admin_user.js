const process = require('process');
const mongoose = require('mongoose');

require('./server/models/db.js');

const userModel = mongoose.model('User');

if (process.argv.length !== 4) {
  console.error('Usage: node add_admin_user EMAIL PASSWORD');
}

userModel.createUser(
  process.argv[2], process.argv[3],
  (err) => {
    console.error(err);
    process.exit(1);
  },
  (user) => {
    console.log('User ' + user.email + ' created');
    process.exit(0);
  });
