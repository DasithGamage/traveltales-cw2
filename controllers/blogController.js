const blogModel = require('../models/blogModel');
const followModel = require('../models/followModel'); // Import followModel

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
    blogModel.getAllBlogs(async (err, blogs) => {
      if (err) {
        console.error(err);
        return res.send('Error loading blog posts.');
      }

      if (req.session.user) {
        const userId = req.session.user.id;

        // Add isFollowing property for each blog author
        for (const blog of blogs) {
          if (blog.user_id === userId) {
            blog.isOwnPost = true;
          } else {
            await new Promise((resolve) => {
              blogModel.isFollowing(userId, blog.user_id, (err, isFollowing) => {
                blog.isFollowing = isFollowing;
                resolve();
              });
            });
          }
        }

        // Get follower and following count
        followModel.getFollowerCount(userId, (err1, followerResult) => {
          if (err1) return res.send('Error fetching follower count');

          followModel.getFollowingCount(userId, (err2, followingResult) => {
            if (err2) return res.send('Error fetching following count');

            res.render('home', {
              blogs,
              followerCount: followerResult.count,
              followingCount: followingResult.count
            });
          });
        });
      } else {
        res.render('home', { blogs });
      }
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
