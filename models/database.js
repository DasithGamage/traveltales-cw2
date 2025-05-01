const sqlite3 = require('sqlite3').verbose();

// Connect to a SQLite database file (creates it if not existing)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

module.exports = db;
