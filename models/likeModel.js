const db = require('./database');

/**
 * Like Model - Manages likes and dislikes on blog posts
 * Handles adding, updating and counting reactions (likes/dislikes)
 */
const likeModel = {
  /**
   * Add or update a user's reaction (like/dislike) to a blog post
   * Uses SQLite's ON CONFLICT to update if the user already reacted to this blog
   * 
   * @param {number} userId - ID of the user adding the reaction
   * @param {number} blogId - ID of the blog post being reacted to
   * @param {string} type - Type of reaction ('like' or 'dislike')
   * @param {function} callback - Callback function to handle the result
   */
  addOrUpdateReaction: (userId, blogId, type, callback) => {
    const query = `
      INSERT INTO likes (user_id, blog_id, type)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, blog_id)
      DO UPDATE SET type = excluded.type
    `;
    db.run(query, [userId, blogId, type], callback);
  },

  /**
   * Count the total number of a specific reaction type for a blog post
   * 
   * @param {number} blogId - ID of the blog post to count reactions for
   * @param {string} type - Type of reaction to count ('like' or 'dislike')
   * @param {function} callback - Callback function that receives the count
   */
  countReactions: (blogId, type, callback) => {
    const query = `SELECT COUNT(*) AS count FROM likes WHERE blog_id = ? AND type = ?`;
    db.get(query, [blogId, type], callback);
  },

  /**
   * Get a user's reaction to a specific blog post
   * Returns the reaction type or null if the user hasn't reacted
   * 
   * @param {number} userId - ID of the user
   * @param {number} blogId - ID of the blog post
   * @param {function} callback - Callback function that receives the reaction
   */
  getUserReaction: (userId, blogId, callback) => {
    const query = `SELECT type FROM likes WHERE user_id = ? AND blog_id = ?`;
    db.get(query, [userId, blogId], callback);
  }
};

module.exports = likeModel;