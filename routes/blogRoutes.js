const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Show all blog posts on home page
router.get('/', blogController.showAllBlogs);

// Show the create blog form
router.get('/blog/create', blogController.showCreateForm);

// Handle blog post submission
router.post('/blog/create', blogController.createBlogPost);

// Edit & Delete
router.get('/blog/edit/:id', blogController.showEditForm);
router.post('/blog/edit/:id', blogController.updateBlogPost);
router.get('/blog/delete/:id', blogController.deleteBlogPost);

// Search blogs by country or username
router.get('/search', blogController.searchBlogs);

module.exports = router;
