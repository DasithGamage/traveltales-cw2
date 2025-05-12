const likeModel = require('../models/likeModel');

/**
 * Like Controller
 * Handles likes and dislikes functionality for blog posts
 * Manages user interactions with blog content
 */
const likeController = {
  /**
   * Like a blog post
   * Adds or updates a like reaction from the current user
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  like: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to like posts.',
        returnUrl: '/login'
      });
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    // Add or update like reaction in database
    likeModel.addOrUpdateReaction(userId, blogId, 'like', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error liking post. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  },

  /**
   * Dislike a blog post
   * Adds or updates a dislike reaction from the current user
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  dislike: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to dislike posts.',
        returnUrl: '/login'
      });
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    // Add or update dislike reaction in database
    likeModel.addOrUpdateReaction(userId, blogId, 'dislike', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error disliking post. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  }
};

module.exports = likeController;