const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// ==========================================
// Blog Listing Routes
// ==========================================

// Show all blog posts on home page
router.get('/', blogController.showAllBlogs);

// ==========================================
// Blog Creation Routes
// ==========================================

// IMPORTANT: Specific routes MUST come before dynamic routes
// Show the create blog form - THIS MUST COME BEFORE /:id route
router.get('/blog/create', blogController.showCreateForm);

// Handle blog post submission
router.post('/blog/create', blogController.createBlogPost);

// ==========================================
// Blog Management Routes
// ==========================================

// Edit blog post form - MUST COME BEFORE /:id route
router.get('/blog/edit/:id', blogController.showEditForm);

// Process blog update
router.post('/blog/edit/:id', blogController.updateBlogPost);

// Delete blog post - MUST COME BEFORE /:id route
router.get('/blog/delete/:id', blogController.deleteBlogPost);

// ==========================================
// Blog Display Routes
// ==========================================

// Show single blog post - THIS MUST COME LAST (after all specific routes)
// This is a catch-all route for /blog/:id patterns
router.get('/blog/:id', blogController.showSingleBlog);

// ==========================================
// Blog Search Routes
// ==========================================

// Search blogs by country or username
router.get('/search', blogController.searchBlogs);

module.exports = router;