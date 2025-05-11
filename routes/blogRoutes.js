const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Show all blog posts on home page
router.get('/', blogController.showAllBlogs);

// IMPORTANT: Specific routes MUST come before dynamic routes
// Show the create blog form - THIS MUST COME BEFORE /:id route
router.get('/blog/create', blogController.showCreateForm);

// Handle blog post submission
router.post('/blog/create', blogController.createBlogPost);

// Edit & Delete - THESE MUST COME BEFORE /:id route
router.get('/blog/edit/:id', blogController.showEditForm);
router.post('/blog/edit/:id', blogController.updateBlogPost);
router.get('/blog/delete/:id', blogController.deleteBlogPost);

// Show single blog post - THIS MUST COME LAST (after all specific routes)
router.get('/blog/:id', blogController.showSingleBlog);

// Search blogs by country or username
router.get('/search', blogController.searchBlogs);

module.exports = router;