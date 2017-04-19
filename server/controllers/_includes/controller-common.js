//  some common helpers functions
const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

//  add error string errArr as appropriate, with error prefixed by
//  appropriate string using itemName
exports.addToErrArr = function addToErrArr(err, itemName, errArr) {
  
}

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
exports.findByIdAndMore = function findByIdAndMore(
  itemModel, itemId, itemName, errArr, callback) {
  if (!itemId) {
    callback(errArr, null);
  } else {
    itemModel.findById(itemId).exec((err, item) => {
      if (err) errArr.push('Error finding ' + itemName + ': ' + err.toString);
      callback(errArr, item);
    });
  }
};
const findByIdAndMore = exports.findByIdAndMore;


// helper function which returns a function that can be passed to an
//  express router callback and which extracts user, quiz from session
//  variables before calling inner with signature:
//     inner(req, res, user, quiz, errArr)
exports.findQuizUserAndCallInner = function findQuizUserAndCallInner(inner) {
  return (req, res, next) => {
    var errArr = [];
    findByIdAndMore(
      userModel, req.session.userId, 'user', errArr, (user) => {
        findByIdAndMore(
          quizModel, req.session.quizId, 'quiz', errArr, (quiz) => {
            inner(req, res, user, quiz, errArr);
          });
      });
  };
};

