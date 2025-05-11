const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const followController = require('../controllers/followController');

// Registration routes
router.get('/register', authController.showRegisterPage);
router.post('/register', authController.registerUser);

// Login routes
router.get('/login', authController.loginPage);
router.post('/login', authController.loginUser);

// Logout route
router.get('/logout', authController.logoutUser);

// User search page with follow/unfollow - CHANGED FROM /search to /users
router.get('/users', followController.searchUsers);

// Profile routes
router.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('profile', { user: req.session.user });
});

router.post('/profile/update', authController.updateProfile);
router.post('/profile/change-password', authController.changePassword);

// Password recovery routes
router.get('/forgot-password', (req, res) => res.render('forgot-password'));
router.post('/verify-questions', authController.verifyEmail);
router.post('/reset-password', authController.resetPassword);

module.exports = router;