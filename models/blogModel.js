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
  }
};

module.exports = blogModel;
