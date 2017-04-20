const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const quizModel = mongoose.model('Quiz');

const common = require('./_includes/controller-common');

/*
///////////////////////////////////////////////////////////////////////////
//   LOGIN / LOGOUT
*/

//  helper for login functions.
//  redirect if user is logged in, otherwise call callback
function redirectIfLoggedIn(req, res, callback) {
  if (req.session.userId) {
    userModel.findById(req.session.userId).exec((err, user) => {
      if (err) {
        req.session.userId = null;
        callback();
        return;
      }
      res.redirect(req.query.redirect
                   ? decodeURI(req.query.redirect) : '/admin');
    });
  } else {
    callback();
  }
}

//  we have to use loginShowReal because express doesn't like callbacks
//  with the wrong signature
exports.loginShow = (req, res, next) => loginShowReal(req, res, next);

//  login screen
//  email, errArr are for showing an error message and prepopulating the
//  email box when a faulty login is tried
function loginShowReal(req, res, next, email, errArr) {
  // initialize errArr;
  if (!errArr) errArr = [];

  function render() {
    res.render('view-admin-login', {
      title: 'Login user',
      email,
      errArr,
      redirect: req.query.redirect
    });
  }

  redirectIfLoggedIn(req, res, render);
}


// act on a login request
exports.loginDo = function login(req, res) {
  redirectIfLoggedIn(req, res, () => {
    const email = req.body.email;
    const password = req.body.password;
    const reshow
          = msg => loginShowReal(req, res, null, email, msg ? [msg] : []);

    if (!(email && password)) {
      reshow('Both email and password must be nonblank');
      return;
    }

    userModel.findOne({ email }, (err, user) => {
      if (err) {
        reshow('Problem with database: ' + err);
      } else if (!user) {
        reshow('Could not find user');
      } else {
        // found user

        // eslint-disable-next-line no-lonely-if
        if (user.validatePassword(password)) {
          req.session.userId = user._id;
          res.redirect(req.query.redirect
                       ? decodeURI(req.query.redirect) : '/admin');
        } else {
          reshow('Incorrect password');
        }
      }
    });
  });
};

//  logout the admin user
exports.logout = function logout(req, res, next) {
  req.session.userId = null;
  res.redirect(req.query.redirect
               ? decodeURI(req.query.redirect) : '/admin/login');
};

/*
///////////////////////////////////////////////////////////////////////////
//   USER, QUIZ LOOKUP FUNCS
*/

// helper function that looks up user from session variables, then either
// redirects to login or calls callback with signature:
//   callback(user, errArr)
//
// this should be the first function called by any routing path into the
// admin console
//
// if no user, redirects to "/admin/login"
// (thus, this cannot be used for /admin/login)
function validateAndCall(req, res, callback) {
  const errArr = [];
  const redirect = () => {
    req.session.userId = null;
    res.redirect('/admin/login?redirect=' + encodeURI(req.url));
  };
  if (!req.session.userId) {
    redirect();
    return; // eslint-disable-line no-useless-return
  } else { // eslint-disable-line no-else-return
    userModel.findById(req.session.userId).exec((err, user) => {
      common.addToErrArr(err, 'user', errArr);
      if (err) {
        redirect();
        return; // eslint-disable-line no-useless-return
      } else { // eslint-disable-line no-else-return
        callback(user, errArr);
        return; // eslint-disable-line no-useless-return
      }
    });
  }
}

/*
///////////////////////////////////////////////////////////////////////////
//   THE ADMIN PAGES
*/

//  does a quiz have the proper structure to be shown?
function isQuizOk(quiz) {
  return (quiz && quiz.startTime && quiz.startIp
          && quiz.questionsCorrect && quiz.questionsAnswered);
}

//  does a quiz have the proper structure to be shown?
function isQuizOkRight(quiz) {
  return (quiz && quiz.startIp && quiz.startTime instanceof Date
          && (typeof quiz.questionsCorrect === 'number')
          && (typeof quiz.questionsAnswered === 'number'));
}

//  sort two quizzes
function quizSortFcn(quiz1, quiz2) {
  // we make a bitmask. lower sorts first. a mask of 0 means that quiz has
  // proper date
  const getSortMask
        = quiz =>
        ((isQuizOk(quiz) ? 0 : 2) + (quiz.startTime instanceof Date ? 0 : 1));

  const time1 = quiz1.startTime;
  const time2 = quiz2.startTime;
  const mask1 = getSortMask(time1);
  const mask2 = getSortMask(time2);

  // if one of mask1 or mask2 are not zero, one of quiz1, quiz2 is not a
  // date
  /* eslint-disable no-else-return, no-lonely-if */
  if (mask1 === 0) {
    if (mask2 === 0) {
      // both mask1 and mask2 are dates
      return quiz1.startTime - quiz2.startTime;
    } else {
      // quiz1 is OK but not quiz2
      return -1;
    }
  } else {
    if (mask2 === 0) {
      // quiz2 is OK but not quiz1
      return 1;
    } else {
      return mask1 - mask2;
    }
  }
  /* eslint-enable no-else-return, no-lonely-if */
}

//  the main admin screen
exports.main = function main(req, res, next) {
  validateAndCall(req, res, (user, errArr) => {
    quizModel.find().exec((err, quizzes) => {
      common.addToErrArr(err, 'all quizzes', errArr);
      console.log(quizzes);
      console.log('OK:' + quizzes.map(quiz => isQuizOk(quiz)));
      res.render('view-admin-main', {
        user,
        quizzes: quizzes.sort(quizSortFcn),
        errArr,
        console,
        isQuizOk
      });
    });
  });
};

//  the admin screen for one quiz
exports.quiz = function quiz(req, res, next) {
  validateAndCall(req, res, (user, errArr) => {
    common.findByIdAndMore(
      quizModel, req.params.quizId, 'quiz', errArr, (quiz) => {
        res.render('view-admin-quiz', { user, quiz, errArr, console });
      });
  });
};

/*
///////////////////////////////////////////////////////////////////////////
//   REGISTRATION
*/

//  again, express is picky about callback signatures
exports.registerShow = (req, res, next) => registerShowReal(req, res, next);

//  registration screen
//  email, errArr are for showing an error message and prepopulating the
//  email box
//  msg is just a random message
function registerShowReal(req, res, next, email, errArr, msg) {
  validateAndCall(req, res, (user, errArr) => {
    res.render('view-admin-register', {
      user,
      email,
      errArr,
      msg
    });
  });
}

exports.registerAdd = function registerAdd(req, res) {
  validateAndCall(req, res, (user, errArr) => {
    const email = req.body.email;
    const password = req.body.password;
    const reshow
          = (errMsg, msg) => registerShowReal(
            req, res, null, email, errMsg ? [errMsg] : [], msg);

    userModel.createUser(
      req.body.email, req.body.password,
      err => registerShowReal(
        req, res, null, email, [err], null),
      user => registerShowReal(
        req, res, null, null, null, 'Successfully added ' + user.email));
  });
};
