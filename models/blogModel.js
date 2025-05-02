const db = require('./database');

const blogModel = {
  // Add a new blog post
  createBlog: (userId, title, content, country, visitDate, callback) => {
    const query = `
      INSERT INTO blogs (user_id, title, content, country, visit_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [userId, title, content, country, visitDate], callback);
  },

  // Get all blog posts (newest first)
  getAllBlogs: (callback) => {
    const query = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      ORDER BY blogs.created_at DESC
    `;
    db.all(query, [], callback);
  }
};

module.exports = blogModel;
