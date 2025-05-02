const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Show all blog posts on home page
router.get('/', blogController.showAllBlogs);

// Show the create blog form
router.get('/blog/create', blogController.showCreateForm);

// Handle blog post submission
router.post('/blog/create', blogController.createBlogPost);

module.exports = router;
