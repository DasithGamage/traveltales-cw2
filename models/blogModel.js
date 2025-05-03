const db = require('./database');

const blogModel = {
  createBlog: (userId, title, content, country, visitDate, callback) => {
    const query = `
      INSERT INTO blogs (user_id, title, content, country, visit_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [userId, title, content, country, visitDate], callback);
  },

  getAllBlogs: (callback) => {
    const query = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      ORDER BY blogs.created_at DESC
    `;
    db.all(query, [], callback);
  },

  getBlogById: (id, callback) => {
    const query = 'SELECT * FROM blogs WHERE id = ?';
    db.get(query, [id], callback);
  },

  updateBlog: (id, title, content, country, visitDate, callback) => {
    const query = `
      UPDATE blogs
      SET title = ?, content = ?, country = ?, visit_date = ?
      WHERE id = ?
    `;
    db.run(query, [title, content, country, visitDate, id], callback);
  },

  deleteBlog: (id, callback) => {
    const query = 'DELETE FROM blogs WHERE id = ?';
    db.run(query, [id], callback);
  },

  // New: Check if follower is following the blog's author
  isFollowing: (followerId, followingId, callback) => {
    const query = `
      SELECT * FROM follows
      WHERE follower_id = ? AND following_id = ?
    `;
    db.get(query, [followerId, followingId], (err, row) => {
      if (err) return callback(err);
      callback(null, !!row); // true if following
    });
  }
};

module.exports = blogModel;
