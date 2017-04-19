const express = require('express');
const quiz = require('../controllers/controller-quiz');
const admin = require('../controllers/controller-admin');

const router = express.Router();

/* GET home page. */
router.get('/', quiz.show);
router.get('/', quiz.answer);
router.get('/restart', quiz.restart);

/* admin login */
router.get('/admin/login', admin.loginShow);
router.post('/admin/login', admin.loginDo);
router.get('/admin', admin.main);
router.get('/admin/:quizId', admin.quiz);
router.get('/admin/logout', admin.logout);
router.get('/admin/register', admin.registerShow);
router.post('/admin/register', admin.registerAdd);

module.exports = router;
