const blogModel = require('../models/blogModel');

const blogController = {
  // Show the blog post form
  showCreateForm: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('create'); // views/create.ejs
  },

  // Handle blog post submission
  createBlogPost: (req, res) => {
    const { title, content, country, visit_date } = req.body;
    const userId = req.session.user.id;

    if (!title || !content) {
      return res.send('Title and content are required.');
    }

    blogModel.createBlog(userId, title, content, country, visit_date, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving blog post.');
      }
      res.redirect('/');
    });
  },

  // Show all blog posts on the homepage
  showAllBlogs: (req, res) => {
    blogModel.getAllBlogs((err, blogs) => {
      if (err) {
        console.error(err);
        return res.send('Error loading blog posts.');
      }
      res.render('home', { blogs });
    });
  }
};

module.exports = blogController;
