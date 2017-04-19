const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

//  find user from userId, quiz from quizId and then call inner.
//
//  form of inner: inner(req, res, errMsg, user, quiz),
//  where errMsg is any appropriate error message (or null if none).
//
//  if userId not given, simply call inner with user as null
function findUserQuizThenCall(req, res, userId, quizId, inner) {
  // called after finding user
  function findQuizThenCall(errMsg, user) {
    if (!quizId) {
      inner(req, res, errMsg, user, null);
    } else {
      quizModel.findById(quizId).exec((err, quiz) => {
        findQuizThenCall(
          err
            ? (errMsg ? errMsg + '<br>' : '')
            + 'Error finding user: ' + err.toString
          : null,
          user);
      });
    }
  }
  
  if (!userId) {
    findQuizThenCall(null, null);
  } else {
    userModel.findById(userId).exec((err, user) => {
      findQuizThenCall(
        err ? 'Error finding user: ' + err.toString : null, user);
    });
  }
}

exports.show = (req, res) => findUserQuizThenCall(showInner);


//  function to show the quiz page after searching for user
function showInner(req, res, errMsg, user, quiz) {
  // check for user first
  userModel.findById
  
  // get quiz for session
  if (!req.session.quizId) {
    // not quiz started. start a new one

    // we use nginx, so we need x-forwarded-for
    quizModel.startNew(
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      (err, quiz) => {
        if (err) {
          res.render('view-error', {
            message: 'Failure making quiz',
            error: err
          });
        } else {
          // set session quiz variable, then render view
          req.session.quizId = quiz._id;
          res.render('view-quiz',
                     { quiz, user: req.session.user });
        }
      });
  } else {
    //  find existing quiz
    quizModel.findById(req.session.quizId).exec((err, quiz) => {
      res.render('view-quiz', {
        quiz: req.session.quiz,
        user: req.session.user,
        
      });
    })
  }
};

//  process an answer
exports.answer = function answer(req, res) {
  const quiz = req.session.quiz;
  var answer = req.body.answer;

  const render = errMsg =>
        res.render('view-quiz', {
          quiz,
          user: req.session.user,
          errMsg
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
