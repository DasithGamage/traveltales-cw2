const db = require('./database');

/**
 * Follow Model - Manages user following relationships
 * Handles creating, reading and deleting follow connections between users
 */
const followModel = {
  /**
   * Create a new following relationship (user follows another user)
   * 
   * @param {number} followerId - ID of the user who is following
   * @param {number} followingId - ID of the user being followed
   * @param {function} callback - Callback function to handle results
   */
  followUser: (followerId, followingId, callback) => {
    const query = `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`;
    db.run(query, [followerId, followingId], callback);
  },

  /**
   * Remove a following relationship (user unfollows another user)
   * 
   * @param {number} followerId - ID of the user who is unfollowing
   * @param {number} followingId - ID of the user being unfollowed
   * @param {function} callback - Callback function to handle results
   */
  unfollowUser: (followerId, followingId, callback) => {
    const query = `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`;
    db.run(query, [followerId, followingId], callback);
  },

  /**
   * Check if one user is following another
   * Returns the follow record if it exists, otherwise null
   * 
   * @param {number} followerId - ID of the potential follower
   * @param {number} followingId - ID of the potentially followed user
   * @param {function} callback - Callback function that receives the result
   */
  isFollowing: (followerId, followingId, callback) => {
    const query = `SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`;
    db.get(query, [followerId, followingId], callback);
  },

  /**
   * Count how many followers a user has
   * 
   * @param {number} userId - ID of the user to check followers for
   * @param {function} callback - Callback function that receives the count
   */
  getFollowerCount: (userId, callback) => {
    const query = `SELECT COUNT(*) AS count FROM follows WHERE following_id = ?`;
    db.get(query, [userId], callback);
  },

  /**
   * Count how many users a specific user is following
   * 
   * @param {number} userId - ID of the user to check following count for
   * @param {function} callback - Callback function that receives the count
   */
  getFollowingCount: (userId, callback) => {
    const query = `SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?`;
    db.get(query, [userId], callback);
  }
};

module.exports = followModel;