const db = require('./database');

/**
 * Blog Model - Handles all database operations related to blog posts
 * This module interfaces with the SQLite database for CRUD operations on blogs
 */
const blogModel = {
  /**
   * Create a new blog post in the database
   * 
   * @param {number} userId - ID of the user creating the blog
   * @param {string} title - Title of the blog post
   * @param {string} content - Main content/body of the blog post
   * @param {string} country - Country that the blog post is about
   * @param {string} visitDate - Date when the user visited the country
   * @param {function} callback - Callback function to handle the result
   */
  createBlog: (userId, title, content, country, visitDate, callback) => {
    const query = `
      INSERT INTO blogs (user_id, title, content, country, visit_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [userId, title, content, country, visitDate], callback);
  },

  /**
   * Retrieve all blog posts with author information
   * Joins with users table to get the author's name
   * 
   * @param {function} callback - Callback function to receive all blogs
   */
  getAllBlogs: (callback) => {
    const query = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      ORDER BY blogs.created_at DESC
    `;
    db.all(query, [], callback);
  },

  /**
   * Get a single blog post by its ID
   * 
   * @param {number} id - ID of the blog post to retrieve
   * @param {function} callback - Callback function to receive the blog
   */
  getBlogById: (id, callback) => {
    const query = 'SELECT * FROM blogs WHERE id = ?';
    db.get(query, [id], callback);
  },

  /**
   * Update an existing blog post
   * 
   * @param {number} id - ID of the blog to update
   * @param {string} title - Updated title
   * @param {string} content - Updated content
   * @param {string} country - Updated country
   * @param {string} visitDate - Updated visit date
   * @param {function} callback - Callback function to handle the result
   */
  updateBlog: (id, title, content, country, visitDate, callback) => {
    const query = `
      UPDATE blogs
      SET title = ?, content = ?, country = ?, visit_date = ?
      WHERE id = ?
    `;
    db.run(query, [title, content, country, visitDate, id], callback);
  },

  /**
   * Delete a blog post from the database
   * 
   * @param {number} id - ID of the blog to delete
   * @param {function} callback - Callback function to handle the result
   */
  deleteBlog: (id, callback) => {
    const query = 'DELETE FROM blogs WHERE id = ?';
    db.run(query, [id], callback);
  },

  /**
   * Check if a user is following another user (blog's author)
   * Returns boolean result through callback
   * 
   * @param {number} followerId - ID of the potential follower
   * @param {number} followingId - ID of the user being followed (blog author)
   * @param {function} callback - Callback with error and boolean result
   */
  isFollowing: (followerId, followingId, callback) => {
    const query = `
      SELECT * FROM follows
      WHERE follower_id = ? AND following_id = ?
    `;
    db.get(query, [followerId, followingId], (err, row) => {
      if (err) return callback(err);
      callback(null, !!row); // Convert row to boolean
    });
  },

  /**
   * Search for blogs by author name or country
   * Case-insensitive partial match search
   * 
   * @param {string} query - Search term to look for
   * @param {function} callback - Callback with search results
   */
  searchByAuthorOrCountry: (query, callback) => {
    const sql = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      WHERE LOWER(users.name) LIKE ? OR LOWER(blogs.country) LIKE ?
      ORDER BY blogs.created_at DESC
    `;
    const values = [`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`];
    db.all(sql, values, callback);
  }
};

module.exports = blogModel;