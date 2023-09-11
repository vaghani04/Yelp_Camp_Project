const express = require('express');
const router = express.Router();
const User = require('../models/user');
const catchAsync = require('../utills/catchAsync');
const passport = require('passport');
const { route } = require('./campgrounds');

router.get('/register', (req, res) => {
    res.render('users/register');
})

router.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        })
        // console.log(registeredUser);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
    // res.send(req.body);
}));

router.get('/login', (req, res) => {
    res.render('users/login');
})

// 'local' is the name of an authentication strategy. Specifically, it's the name of the strategy being used with Passport.js to authenticate users during the login process.
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome Back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

router.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Good Bye!");
        res.redirect('/campgrounds');
    });
});

module.exports = router;