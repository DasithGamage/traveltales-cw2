const sqlite3 = require('sqlite3').verbose();

/**
 * Database Connection Module
 * Creates and initializes the SQLite database connection 
 * and sets up the required tables if they don't exist
 */

// Connect to a SQLite database file (creates it if not existing)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create blogs table if not exists
// This table stores all blog posts with foreign key to users
db.run(`
  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    country TEXT,
    visit_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create follows table if not exists
// This table manages user following relationships
db.run(`
  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER,
    following_id INTEGER,
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id)
  )
`);

// Create likes table if not exists
// This table tracks like/dislike reactions on blog posts
db.run(`
  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blog_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('like', 'dislike')) NOT NULL,
    UNIQUE(user_id, blog_id), -- prevents duplicate likes/dislikes from same user
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (blog_id) REFERENCES blogs(id)
)
`);

// Create security questions table if not exists
// This table stores security questions for password recovery
db.run(`
  CREATE TABLE IF NOT EXISTS security_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question1 TEXT NOT NULL,
    answer1 TEXT NOT NULL,
    question2 TEXT NOT NULL,
    answer2 TEXT NOT NULL,
    question3 TEXT NOT NULL,
    answer3 TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Export the database connection for use in other modules
module.exports = db;