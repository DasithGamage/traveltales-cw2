const followModel = require('../models/followModel');
const userModel = require('../models/userModel');

const followController = {
  follow: (req, res) => {
    const followerId = req.session.user.id;
    const followingId = parseInt(req.params.id);

    if (followerId === followingId) return res.send('You cannot follow yourself.');

    followModel.followUser(followerId, followingId, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error following user.');
      }
      res.redirect('back');
    });
  },

  unfollow: (req, res) => {
    const followerId = req.session.user.id;
    const followingId = parseInt(req.params.id);

    followModel.unfollowUser(followerId, followingId, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error unfollowing user.');
      }
      res.redirect('back');
    });
  },

  // New: Load users excluding current user, and check follow status
  searchUsers: (req, res) => {
    const currentUserId = req.session.user.id;

    userModel.getAllExcept(currentUserId, async (err, users) => {
      if (err) return res.send('Error loading users.');

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
