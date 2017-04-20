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

//  the main admin screen
exports.main = function main(req, res, next) {
  validateAndCall(req, res, (user, errArr) => {
    quizModel.find().exec((err, quizzes) => {
      common.addToErrArr(err, 'all quizzes', errArr);
      res.render('view-admin-main', { user, quizzes, errArr });
    });
  });
};

//  the admin screen for one quiz
exports.quiz = function quiz(req, res, next) {
  validateAndCall(req, res, (user, errArr) => {
    common.findByIdAndMore(
      quizModel, req.params.quizId, 'quiz', errArr, (quiz) => {
        res.render('view-quiz', { user, quiz, errArr });
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
      err => reshow(err.toString()),
      user => reshow(null, 'Successfully added ' + user.email));
  });
};
