const mongoose = require('mongoose');

const findByIdAndMore = require('./_includes/find_by_id_and_more');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

// (req, res, user, quiz, errArr)
// for each function from index, we first find quiz, user
exports.show = (req, res) => {
  showInner()
  }
  findUserQuizThenCall(showInner);
exports.answer = (req, res) => findUserQuizThenCall(answerInner);
//  restart the current player's history / start new player
exports.restart = function restart(req, res) {
  req.session.quiz = null;
  res.redirect('/');
};

// helper function which extracts user, quiz from session variables and
//   calls an inner function with signature:
//     inner(req, res, user, quiz, errArr)
// errArr defaults to an empty array
function findQuizUserAndCallInner(req, res, inner) {
  if (!errArr) {
    errArr = [];
  }
  findByIdAndMore(userModel, req.session.userId, 'user', errArr, (user) => {
    findByIdAndMore(quizModel, req.session.quizId, 'quiz', errArr, (quiz) => {
      inner(req, res, user, quiz, errArr);
    });
  });
}

//  find user from userId, quiz from quizId and then call inner.
//
//  form of inner: inner(req, res, errArr, user, quiz),
//  where errArr is an array of appropriate error messages (or [] if none).
//
//  if userId not given, simply call inner with user as null
function findUserQuizThenCall(req, res, userId, quizId, inner) {
  // findQuizThenCall called after finding user
  function findQuizThenCall(errArr, user) {
    if (!quizId) {
      inner(req, res, errArr, user, null);
    } else {
      quizModel.findById(quizId).exec((err, quiz) => {
        inner(req, res,
              err
              ? errArr.concat(
                ['Error finding user: ' + err.toString()])
              : errArr,
              user, quiz);
      });
    }
  }

  if (!userId) {
    findQuizThenCall([], null);
  } else {
    userModel.findById(userId).exec((err, user) => {
      findQuizThenCall(
        err ? 'Error finding user: ' + err.toString : [], user);
    });
  }
}

//  function to show the quiz page
function showInner(req, res, user, quiz, errArr) {
  if (!quiz) {
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
  } else {
    res.render('view-quiz', { user, quiz, errArr });
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
        err => render(err ? err.toString() : '')
      );
    }
  }
}
