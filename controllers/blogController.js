const blogModel = require('../models/blogModel');

const blogController = {
  showCreateForm: (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('create');
  },

  createBlogPost: (req, res) => {
    const { title, content, country, visit_date } = req.body;
    const userId = req.session.user.id;

    if (!title || !content) return res.send('Title and content are required.');

    blogModel.createBlog(userId, title, content, country, visit_date, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving blog post.');
      }
      res.redirect('/');
    });
  },

  showAllBlogs: (req, res) => {
    blogModel.getAllBlogs((err, blogs) => {
      if (err) {
        console.error(err);
        return res.send('Error loading blog posts.');
      }
      res.render('home', { blogs });
    });
  },

  showEditForm: (req, res) => {
    const blogId = req.params.id;
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) return res.send('Blog not found.');
      if (blog.user_id !== req.session.user.id) return res.send('Unauthorized.');
      res.render('edit', { blog });
    });
  },

  updateBlogPost: (req, res) => {
    const blogId = req.params.id;
    const { title, content, country, visit_date } = req.body;
    blogModel.updateBlog(blogId, title, content, country, visit_date, (err) => {
      if (err) return res.send('Error updating blog.');
      res.redirect('/');
    });
  },

  deleteBlogPost: (req, res) => {
    const blogId = req.params.id;
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) return res.send('Blog not found.');
      if (blog.user_id !== req.session.user.id) return res.send('Unauthorized.');
      blogModel.deleteBlog(blogId, (err) => {
        if (err) return res.send('Error deleting blog.');
        res.redirect('/');
      });
    });
  }
};

module.exports = blogController;
