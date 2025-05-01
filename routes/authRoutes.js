const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.showRegisterPage);
router.post('/register', authController.registerUser);

// Login routes
router.get('/login', authController.loginPage);
router.post('/login', authController.loginUser);

// Logout route
router.get('/logout', authController.logoutUser);

module.exports = router;
