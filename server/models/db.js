//  database connectivity

const mongoose = require('mongoose');
const credentials = require('../../credentials.js');

mongoose.connect(credentials.mongo.connectionString);

// CONNECTION EVENTS
mongoose.connection.on('connected', function mongoConn() {
  console.log('Mongoose connected');
});
mongoose.connection.on('error', function mongoErr(err) {
  console.log(`Mongoose connection error: ${err}`);
});
mongoose.connection.on('disconnected', function mongoDisc() {
  console.log('Mongoose disconnected');
});

// handle disconnects

const disconnectWiMsg = function disconnectWiMsg(msg, callback) {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnect due to ${msg}`);
    callback();
  });
};

// nodemon restarts
process.once('SIGUSR2', () => {
  disconnectWiMsg(
    'nodemon restart', () => process.kill(process.pid, 'SIGUSR2'));
});

// app terminates
process.once('SIGINT', () => {
  disconnectWiMsg('apt termination', () => process.exit(0));
});

// for Heroku app terminates
process.once('SIGTERM', () => {
  disconnectWiMsg('Heroku apt termination', () => process.exit(0));
});

process.on('SIGINT', disconnectWiMsg(
  'nodemon restart', () => process.kill(process.pid, 'SIGUSR2')));

// add schema, model
require('./model-quiz');
require('./model-user');
