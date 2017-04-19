//  some common helpers functions
const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

//  findById on model and then append to errArr as necessary.
//  errArr is the current errArr, which might be altered (as well as being
//    passed to callback)
//  itemModel is a mongoose model.
//  itemId is the ID of the item
//  itemName is used in an error message if item not found
//  the callback is: callback(item, errArr)
//
//  if no itemId is given, callback is immediately called with
//    callback(null, errArr)
//
function findByIdAndMore(itemModel, itemId, itemName, errArr, callback) {
  if (!itemId) {
    callback(errArr, null);
  } else {
    itemModel.findById(itemId).exec((err, item) => {
      if (err) errArr.push('Error finding ' + itemName + ': ' + err.toString);
      callback(errArr, item);
    });
  }
}

// helper function which extracts user from session variables and
//   calls an inner function with signature:
//     inner(req, res, user, errArr)
// errArr defaults to an empty array
exports.findUserAndCallInner = function findUserAndCallInner(
  req, res, inner, errArr) {
  if (!errArr) {
    errArr = [];
  }
  findByIdAndMore(userModel, req.session.userId, 'user', errArr, (user) => {
    inner(req, res, user, errArr);
  });
};

// helper function which extracts user, quiz from session variables and
//   calls an inner function with signature:
//     inner(req, res, user, quiz, errArr)
// errArr defaults to an empty array
exports.findQuizUserAndCallInner = function findQuizUserAndCallInner(
  req, res, inner, errArr) {
  if (!errArr) {
    errArr = [];
  }
  findByIdAndMore(userModel, req.session.userId, 'user', errArr, (user) => {
    findByIdAndMore(quizModel, req.session.quizId, 'quiz', errArr, (quiz) => {
      inner(req, res, user, quiz, errArr);
    });
  });
};
