const db = require('./database');

// Create the users table if it doesn't exist
// This ensures the database has the required schema on application startup
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * User Model - Handles all user-related database operations
 * Manages user accounts, authentication, and profile management
 */
module.exports = {
  /**
   * Create a new user account
   * 
   * @param {string} name - User's display name
   * @param {string} email - User's email address (must be unique)
   * @param {string} hashedPassword - Bcrypt-hashed password
   * @param {function} callback - Callback function with error or result
   */
  createUser: (name, email, hashedPassword, callback) => {
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [name, email, hashedPassword], function(err) {
      callback(err, this); // Pass the statement object for access to lastID
    });
  },

  /**
   * Find a user by their email address
   * Used primarily for authentication
   * 
   * @param {string} email - Email address to search for
   * @param {function} callback - Callback function that receives the user
   */
  findUserByEmail: (email, callback) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], callback);
  },

  /**
   * Check if an email address is already registered
   * Used during registration to prevent duplicate accounts
   * 
   * @param {string} email - Email address to check
   * @param {function} callback - Callback function that receives result
   */
  checkEmailExists: (email, callback) => {
    const sql = `SELECT id FROM users WHERE email = ?`;
    db.get(sql, [email], callback);
  },

  /**
   * Find a user by their ID
   * 
   * @param {number} id - User ID to look up
   * @param {function} callback - Callback function that receives the user
   */
  findUserById: (id, callback) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.get(sql, [id], callback);
  },

  /**
   * Get all users except the current one
   * Used for user search and follow functionality
   * 
   * @param {number} currentUserId - ID of the current user to exclude
   * @param {function} callback - Callback function that receives all other users
   */
  getAllExcept: (currentUserId, callback) => {
    const sql = `SELECT * FROM users WHERE id != ?`;
    db.all(sql, [currentUserId], callback);
  },
  
  /**
   * Save a user's security questions and answers for password recovery
   * 
   * @param {number} userId - ID of the user
   * @param {string} answer1 - Answer to first security question
   * @param {string} answer2 - Answer to second security question
   * @param {string} answer3 - Answer to third security question
   * @param {function} callback - Callback function to handle result
   */
  saveSecurityQuestions: (userId, answer1, answer2, answer3, callback) => {
    const sql = `INSERT INTO security_questions (user_id, question1, answer1, question2, answer2, question3, answer3) 
                 VALUES (?, 'mothers maiden name', ?, 'first pet name', ?, 'birth city', ?)`;
    db.run(sql, [userId, answer1, answer2, answer3], callback);
  },
  
  /**
   * Verify a user's security question answers during password recovery
   * 
   * @param {string} email - User's email address
   * @param {string} answer1 - Provided answer to first question
   * @param {string} answer2 - Provided answer to second question
   * @param {string} answer3 - Provided answer to third question
   * @param {function} callback - Callback with boolean indicating if answers match
   */
  verifySecurityAnswers: (email, answer1, answer2, answer3, callback) => {
    const sql = `SELECT sq.* FROM security_questions sq 
                 JOIN users u ON sq.user_id = u.id 
                 WHERE u.email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, false);
      
      // Check if all provided answers match stored answers
      const isValid = row.answer1 === answer1 && 
                      row.answer2 === answer2 && 
                      row.answer3 === answer3;
      callback(null, isValid);
    });
  },
  
  /**
   * Update a user's password
   * Used for both password recovery and profile updates
   * 
   * @param {string} email - User's email address
   * @param {string} newPassword - New hashed password
   * @param {function} callback - Callback function to handle result
   */
  updatePassword: (email, newPassword, callback) => {
    const sql = `UPDATE users SET password = ? WHERE email = ?`;
    db.run(sql, [newPassword, email], callback);
  },
  
  /**
   * Update a user's profile information
   * 
   * @param {number} userId - ID of the user to update
   * @param {string} name - New display name
   * @param {string} email - New email address
   * @param {function} callback - Callback function to handle result
   */
  updateUser: (userId, name, email, callback) => {
    const sql = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
    db.run(sql, [name, email, userId], callback);
  }
};