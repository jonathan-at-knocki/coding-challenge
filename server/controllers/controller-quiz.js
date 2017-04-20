const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

const common = require('./_includes/controller-common');

// helper function which returns a function that can be passed to an
//  express app callback and which extracts user, quiz from session
//  variables before calling inner with signature:
//     inner(req, res, user, quiz, errArr)
function findQuizUserAndCallInner(inner) {
  return (req, res, next) => {
    var errArr = [];
    common.findByIdAndMore(
      userModel, req.session.userId, 'user', errArr, (user) => {
        common.findByIdAndMore(
          quizModel, req.session.quizId, 'quiz', errArr, (quiz) => {
            inner(req, res, user, quiz, errArr);
          });
      });
  };
}

// for each function from index, we first need to find quiz, user
exports.show = findQuizUserAndCallInner(showInner);
exports.answer = findQuizUserAndCallInner(answerInner);
//  restart the current player's history / start new player
exports.restart = function restart(req, res) {
  req.session.quizId = null;
  res.redirect('/');
};

//  function to show the quiz page
function showInner(req, res, user, quiz, errArr) {
  if (quiz) {
    res.render('view-quiz', { user, quiz, errArr });
  } else {
    // no quiz started. start a new one

    // we use nginx, so we need x-forwarded-for
    quizModel.startNew(
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      (err, quiz) => {
        if (err) {
          quiz = null;
          errArr.push('Error starting new quiz: ' + err.toString());
        } else {
          req.session.quizId = quiz._id;
        }
        res.render('view-quiz', { user, quiz, errArr });
      });
  }
}

//  process an answer
function answerInner(req, res, user, quiz, errArr) {
  var answer = req.body.answer;

  const render = (errMsg) => {
    if (errMsg) errArr.push(errMsg);
    res.render('view-quiz', { quiz, user, errArr });
  };
  // get quiz for session
  if (!quiz) {
    render('Answer given with no quiz started');
  } else if (!answer) {
    render('No answer given');
  } else {
    answer = parseInt(answer, 10);
    if (isNaN(answer)) {
      render('Bad answer given: ' + answer);
    } else {
      quiz.answerQuestion(
        answer,
        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        res.redirect('/'));
    }
  }
}
