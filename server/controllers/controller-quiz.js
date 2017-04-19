const mongoose = require('mongoose');

const quizModel = mongoose.model('Quiz');

//  show the quiz page
exports.show = function show(req, res) {
  // get quiz for session
  if (!req.session.quiz) {
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
          req.session.quiz = quiz;
          res.render('view-quiz',
                     { quiz, user: req.session.user });
        }
      });
  } else {
    res.render('view-quiz', {
      quiz: req.session.quiz,
      user: req.session.user
    });
  }
};

//  process an answer
exports.answer = function answer(req, res) {
  const quiz = req.session.quiz;
  const answer = parseInt(req.params.answer, 10);
  const render = errMsg =>
        res.render('view-quiz', {
          quiz,
          user: req.session.user,
          errMsg
        });
  // get quiz for session
  if (!req.session.quiz) {
    render('Answer given with no quiz started');
  } else if (isNaN(req.params.answer)) {
    render('Bad answer given: ' + req.params.answer);
  } else {
    quiz.answerQuestion(
      answer,
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      err => render(err ? err.toString() : '')
    );
  }
};

//  restart the current player's history / start new player
exports.restart = function restart(req, res) {
  req.session.quiz = null;
  res.redirect('/');
};
