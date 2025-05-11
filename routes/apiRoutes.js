const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiAuth');
const blogController = require('../controllers/blogController');

// Apply API key authentication to all routes in this file
router.use(apiKeyAuth);

// Blog API endpoints
router.get('/blogs', blogController.getAllBlogsAPI);
router.get('/blogs/:id', blogController.getBlogByIdAPI);
router.post('/blogs', blogController.createBlogAPI);
router.put('/blogs/:id', blogController.updateBlogAPI);
router.delete('/blogs/:id', blogController.deleteBlogAPI);

// Search API endpoints
router.get('/search', blogController.searchBlogsAPI);

// Statistics API endpoints
router.get('/stats/popular-posts', blogController.getPopularPostsAPI);
router.get('/stats/recent-posts', blogController.getRecentPostsAPI);

module.exports = router;