const followModel = require('../models/followModel');
const userModel = require('../models/userModel');

/**
 * Follow Controller
 * Handles all user following system operations
 * Manages follow/unfollow relationships and user search
 */
const followController = {
  /**
   * Follow a user
   * Creates a new following relationship between users
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  follow: (req, res) => {
    const followerId = req.session.user?.id;
    const followingId = parseInt(req.params.id);

    // Check if user is logged in
    if (!followerId) {
      return res.status(401).render('error', { 
        message: 'Please log in to follow users.',
        returnUrl: '/login'
      });
    }
    
    // Prevent users from following themselves
    if (followerId === followingId) {
      return res.status(400).render('error', { 
        message: 'You cannot follow yourself.',
        returnUrl: '/'
      });
    }

    // Create the follow relationship
    followModel.followUser(followerId, followingId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error following user. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  },

  /**
   * Unfollow a user
   * Removes an existing following relationship
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  unfollow: (req, res) => {
    const followerId = req.session.user?.id;
    const followingId = parseInt(req.params.id);

    // Check if user is logged in
    if (!followerId) {
      return res.status(401).render('error', { 
        message: 'Please log in to unfollow users.',
        returnUrl: '/login'
      });
    }

    // Remove the follow relationship
    followModel.unfollowUser(followerId, followingId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error unfollowing user. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  },

  /**
   * Search for users with follow status
   * Shows all users except the current one with follow/unfollow buttons
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  searchUsers: (req, res) => {
    const currentUserId = req.session.user?.id;

    // Check if user is logged in
    if (!currentUserId) {
      return res.status(401).render('error', { 
        message: 'Please log in to search for users.',
        returnUrl: '/login'
      });
    }

    // Get all users except the current one
    userModel.getAllExcept(currentUserId, async (err, users) => {
      if (err) {
        return res.status(500).render('error', { 
          message: 'Error loading users. Please try again.',
          returnUrl: '/'
        });
      }

      // Enhance each user with follow status information
      const enrichedUsers = await Promise.all(users.map(user => {
        return new Promise((resolve) => {
          followModel.isFollowing(currentUserId, user.id, (err, result) => {
            user.isFollowing = !!result;
            resolve(user);
          });
        });
      }));

      // Render the user search page
      res.render('search', { users: enrichedUsers });
    });
  }
};

module.exports = followController;