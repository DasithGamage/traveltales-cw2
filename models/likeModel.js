const db = require('./database');

const likeModel = {
  // Like or Dislike a blog post
  addOrUpdateReaction: (userId, blogId, type, callback) => {
    const query = `
      INSERT INTO likes (user_id, blog_id, type)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, blog_id)
      DO UPDATE SET type = excluded.type
    `;
    db.run(query, [userId, blogId, type], callback);
  },

  // Count total likes or dislikes
  countReactions: (blogId, type, callback) => {
    const query = `SELECT COUNT(*) AS count FROM likes WHERE blog_id = ? AND type = ?`;
    db.get(query, [blogId, type], callback);
  },

  // Check if user already reacted
  getUserReaction: (userId, blogId, callback) => {
    const query = `SELECT type FROM likes WHERE user_id = ? AND blog_id = ?`;
    db.get(query, [userId, blogId], callback);
  }
};

module.exports = likeModel;
