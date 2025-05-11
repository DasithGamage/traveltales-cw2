const db = require('./database');

// Create the users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = {
  // Create new user
  createUser: (name, email, hashedPassword, callback) => {
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [name, email, hashedPassword], function(err) {
      callback(err, this);
    });
  },

  // Find user by email
  findUserByEmail: (email, callback) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], callback);
  },

  // Check if email already exists (used for registration)
  checkEmailExists: (email, callback) => {
    const sql = `SELECT id FROM users WHERE email = ?`;
    db.get(sql, [email], callback);
  },

  // Find user by ID
  findUserById: (id, callback) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.get(sql, [id], callback);
  },

  // Get all users except current one (used in follow system)
  getAllExcept: (currentUserId, callback) => {
    const sql = `SELECT * FROM users WHERE id != ?`;
    db.all(sql, [currentUserId], callback);
  },
  
  // New methods for profile management and password reset
  saveSecurityQuestions: (userId, answer1, answer2, answer3, callback) => {
    const sql = `INSERT INTO security_questions (user_id, question1, answer1, question2, answer2, question3, answer3) 
                 VALUES (?, 'mothers maiden name', ?, 'first pet name', ?, 'birth city', ?)`;
    db.run(sql, [userId, answer1, answer2, answer3], callback);
  },
  
  verifySecurityAnswers: (email, answer1, answer2, answer3, callback) => {
    const sql = `SELECT sq.* FROM security_questions sq 
                 JOIN users u ON sq.user_id = u.id 
                 WHERE u.email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, false);
      
      const isValid = row.answer1 === answer1 && 
                      row.answer2 === answer2 && 
                      row.answer3 === answer3;
      callback(null, isValid);
    });
  },
  
  updatePassword: (email, newPassword, callback) => {
    const sql = `UPDATE users SET password = ? WHERE email = ?`;
    db.run(sql, [newPassword, email], callback);
  },
  
  updateUser: (userId, name, email, callback) => {
    const sql = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
    db.run(sql, [name, email, userId], callback);
  }
};