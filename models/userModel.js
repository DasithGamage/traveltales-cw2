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
    db.run(sql, [name, email, hashedPassword], callback);
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
  }
};
