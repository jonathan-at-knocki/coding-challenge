const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

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

exports.show = (req, res) => findUserQuizThenCall(showInner);

//  function to show the quiz page
function showInner(req, res, errArr, user, quiz) {
  if (!quiz) {
    // no quiz started. start a new one

    // we use nginx, so we need x-forwarded-for
    quizModel.startNew(
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      (err, quiz) => {
        if (err) {
          quiz = null;
          errArr.push('Error startig new quiz: ' + err.toString());
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
exports.answer = function answer(req, res) {
  const quiz = req.session.quiz;
  var answer = req.body.answer;

  const render = errArr =>
        res.render('view-quiz', {
          quiz,
          user: req.session.user,
          errArr
        });
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
};

//  restart the current player's history / start new player
exports.restart = function restart(req, res) {
  req.session.quiz = null;
  res.redirect('/');
};
