const mongoose = require('mongoose');

const userModel = mongoose.model('User');

/*
///////////////////////////////////////////////////////////////////////////
//   LOGIN / LOGOUT
*/

//  login screen
//  email, errMsg are for showing an error message and prepopulating the
//  email box
exports.loginShow = function loginShow(req, res, next, email, errMsg) {
  res.render('view-admin-login', {
    title: 'Login user',
    email,
    errMsg
  });
};

exports.loginDo = function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const reshow = msg => exports.loginShow(req, res, null, email, msg);

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
        req.session.user = user;
        res.redirect('/admin');
      } else {
        reshow('Incorrect password');
      }
    }
  });
};

//  logout the admin user
exports.logout = function logout(req, res, next) {
  req.session.user = null;
  res.redirect(req.query.redirect ? req.query.redirect : '/admin/login');
};

/*
///////////////////////////////////////////////////////////////////////////
//   THE ADMIN PAGES
*/


//  the main admin screen
exports.main = function admin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/admin/login');
    return;
  }

  res.render('view-admin-main', { user: req.session.user });
};

//  the admin screen for one quiz
exports.quiz = function quiz(req, res, next) {
  if (!req.session.user) {
    res.redirect('/admin/login');
    return;
  }

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
  
  res.render('index', { title: 'Express' });
};


/*
///////////////////////////////////////////////////////////////////////////
//   REGISTRATION
*/

//  registration screen
//  email, errMsg are for showing an error message and prepopulating the
//  email box
const registerShow = function registerShow(req, res, next, email, errMsg) {
  if (!req.session.user) {
    res.redirect('/admin/login');
    return;
  }

  if (req.session.user) {
    res.render('view-admin-register', {
      title: 'Register new admin user',
      email,
      errMsg
    });
  } else {
    res.redirect('/admin/login');
  }
};
exports.registerShow = registerShow;

exports.registerAdd = function register(req, res) {
  if (!req.session.user) {
    res.redirect('/admin/login');
    return;
  }

  const email = req.body.email;
  const password = req.body.password;
  const reshow = msg => registerShow(req, res, null, email, msg);

  // attempt to add user

  if (!(email && password)) {
    reshow('Both email and password must be nonblank');
    return;
  }

  // first check for existing user
  userModel.findOne({ email }, (err, user) => {
    if (err) {
      reshow('Error searching for email: ' + err);
    } else if (!user) {
      // user not found. add him
      userModel.create({ email }, (err, user) => {
        if (err) {
          reshow('Error adding user: ' + err);
          return;
        }
        user.setPassword(password);
        user.save((err) => {
          if (err) {
            reshow('Error saving user password: ' + err);
            return;
          }
          // all good. go to login
          res.redirect('/admin/login');
        });
      });
    } else {
      // email exists already
      reshow('Email already exists in db');
    }
  });
};
