const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');

// Follow a user (POST)
router.post('/follow/:id', followController.follow);

// Unfollow a user (POST)
router.post('/unfollow/:id', followController.unfollow);

module.exports = router;
