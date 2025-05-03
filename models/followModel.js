const db = require('./database');

const followModel = {
  // Follow a user
  followUser: (followerId, followingId, callback) => {
    const query = `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`;
    db.run(query, [followerId, followingId], callback);
  },

  // Unfollow a user
  unfollowUser: (followerId, followingId, callback) => {
    const query = `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`;
    db.run(query, [followerId, followingId], callback);
  },

  // Check if one user is following another
  isFollowing: (followerId, followingId, callback) => {
    const query = `SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`;
    db.get(query, [followerId, followingId], callback);
  },

  // Get the number of followers a user has
  getFollowerCount: (userId, callback) => {
    const query = `SELECT COUNT(*) AS count FROM follows WHERE following_id = ?`;
    db.get(query, [userId], callback);
  },

  // Get the number of users a user is following
  getFollowingCount: (userId, callback) => {
    const query = `SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?`;
    db.get(query, [userId], callback);
  }
};

module.exports = followModel;
