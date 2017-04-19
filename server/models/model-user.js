//  the model for a user

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  hash: String,
  salt: String
});

userSchema.methods.setPassword = function setPassword(password) {
  this.salt = crypto.randomBytes(20).toString('hex');
  this.hash =
    crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512')
    .toString('hex');
};

userSchema.methods.validatePassword = function validatePassword(password) {
  const hash =
        crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512')
        .toString('hex');
  return this.hash === hash;
};

mongoose.model('User', userSchema);
