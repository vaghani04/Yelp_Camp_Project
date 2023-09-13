const express = require('express');
const router = express.Router();
const User = require('../models/user');
const catchAsync = require('../utills/catchAsync');
const passport = require('passport');
const { route } = require('./campgrounds');
const users = require('../controllers/users');
const user = require('../models/user');

router.get('/register', users.renderRegister)

router.post('/register', catchAsync(users.register));

router.get('/login', users.renderLogin)

// 'local' is the name of an authentication strategy. Specifically, it's the name of the strategy being used with Passport.js to authenticate users during the login process.
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

router.get('/logout', users.logout);

module.exports = router;