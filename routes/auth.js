const express = require('express');
const passport = require('passport');
const router = express.Router();

// Discord login
router.get('/login', passport.authenticate('discord'));

// OAuth2 callback
router.get('/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;