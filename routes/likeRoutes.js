const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

// ==========================================
// Blog Interaction Routes
// ==========================================

// Like a blog post - Processes POST request to like a specific blog
router.post('/like/:id', likeController.like);

// Dislike a blog post - Processes POST request to dislike a specific blog
router.post('/dislike/:id', likeController.dislike);

module.exports = router;