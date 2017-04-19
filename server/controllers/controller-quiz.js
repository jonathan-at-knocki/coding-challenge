const mongoose = require('mongoose');

const common = require('./_includes/controller-common');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

// for each function from index, we first need to find quiz, user
exports.show = common.findQuizUserAndCallInner(showInner);
exports.answer = common.findQuizUserAndCallInner(answerInner);
//  restart the current player's history / start new player
exports.restart = function restart(req, res) {
  req.session.quiz = null;
  res.redirect('/');
};

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
