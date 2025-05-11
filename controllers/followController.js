const followModel = require('../models/followModel');
const userModel = require('../models/userModel');

const followController = {
  follow: (req, res) => {
    const followerId = req.session.user?.id;
    const followingId = parseInt(req.params.id);

    if (!followerId) {
      return res.status(401).render('error', { 
        message: 'Please log in to follow users.',
        returnUrl: '/login'
      });
    }
    
    if (followerId === followingId) {
      return res.status(400).render('error', { 
        message: 'You cannot follow yourself.',
        returnUrl: '/'
      });
    }

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

  unfollow: (req, res) => {
    const followerId = req.session.user?.id;
    const followingId = parseInt(req.params.id);

    if (!followerId) {
      return res.status(401).render('error', { 
        message: 'Please log in to unfollow users.',
        returnUrl: '/login'
      });
    }

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

  // Search users and show follow/unfollow status
  searchUsers: (req, res) => {
    const currentUserId = req.session.user?.id;

    if (!currentUserId) {
      return res.status(401).render('error', { 
        message: 'Please log in to search for users.',
        returnUrl: '/login'
      });
    }

    userModel.getAllExcept(currentUserId, async (err, users) => {
      if (err) {
        return res.status(500).render('error', { 
          message: 'Error loading users. Please try again.',
          returnUrl: '/'
        });
      }

      const enrichedUsers = await Promise.all(users.map(user => {
        return new Promise((resolve) => {
          followModel.isFollowing(currentUserId, user.id, (err, result) => {
            user.isFollowing = !!result;
            resolve(user);
          });
        });
      }));

      res.render('search', { users: enrichedUsers });
    });
  }
};

module.exports = followController;