const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const followController = require('../controllers/followController');

// ==========================================
// User Registration Routes
// ==========================================

// Display registration form
router.get('/register', authController.showRegisterPage);

// Process registration form submission
router.post('/register', authController.registerUser);

// ==========================================
// Authentication Routes
// ==========================================

// Display login form 
router.get('/login', authController.loginPage);

// Process login form submission
router.post('/login', authController.loginUser);

// Handle user logout
router.get('/logout', authController.logoutUser);

// ==========================================
// User Management Routes
// ==========================================

// Search users page with follow/unfollow functionality
router.get('/users', followController.searchUsers);

// ==========================================
// User Profile Routes
// ==========================================

// Display user profile page
router.get('/profile', (req, res) => {
  // Redirect to login if user is not authenticated
  if (!req.session.user) {
    return res.redirect('/login');
  }
  // Display profile page with user data from session
  res.render('profile', { user: req.session.user });
});

// Process profile update request
router.post('/profile/update', authController.updateProfile);

// Process password change request
router.post('/profile/change-password', authController.changePassword);

// ==========================================
// Password Recovery Routes
// ==========================================

// Display forgot password form
router.get('/forgot-password', (req, res) => res.render('forgot-password'));

// Verify user email and show security questions
router.post('/verify-questions', authController.verifyEmail);

// Process security answers and reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;