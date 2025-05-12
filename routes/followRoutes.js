const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');

// ==========================================
// User Following System Routes
// ==========================================

// Follow a user - Processes POST request to follow a specific user
router.post('/follow/:id', followController.follow);

// Unfollow a user - Processes POST request to unfollow a specific user
router.post('/unfollow/:id', followController.unfollow);

module.exports = router;