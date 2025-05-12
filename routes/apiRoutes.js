const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiAuth');
const blogController = require('../controllers/blogController');

// Apply API key authentication middleware to all routes
// Ensures all API endpoints are protected by API key validation
router.use(apiKeyAuth);

// ==========================================
// Blog CRUD API Endpoints
// ==========================================

// Get all blogs
router.get('/blogs', blogController.getAllBlogsAPI);

// Get a specific blog by ID
router.get('/blogs/:id', blogController.getBlogByIdAPI);

// Create a new blog
router.post('/blogs', blogController.createBlogAPI);

// Update an existing blog
router.put('/blogs/:id', blogController.updateBlogAPI);

// Delete a blog
router.delete('/blogs/:id', blogController.deleteBlogAPI);

// ==========================================
// Search API Endpoints
// ==========================================

// Search blogs by country or author
router.get('/search', blogController.searchBlogsAPI);

// ==========================================
// Statistics API Endpoints
// ==========================================

// Get popular blog posts (most liked)
router.get('/stats/popular-posts', blogController.getPopularPostsAPI);

// Get recent blog posts
router.get('/stats/recent-posts', blogController.getRecentPostsAPI);

module.exports = router;