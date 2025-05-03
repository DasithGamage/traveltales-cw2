const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

// Like and Dislike routes
router.post('/like/:id', likeController.like);
router.post('/dislike/:id', likeController.dislike);

module.exports = router;
