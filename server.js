const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes'); // Added blog routes
const followRoutes = require('./routes/followRoutes'); // Follow routes
const likeRoutes = require('./routes/likeRoutes'); // Likes routes

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

// Make session available to EJS templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Route handling
app.use('/', authRoutes);
app.use('/', blogRoutes); // Registered blog routes and Search routes
app.use('/', followRoutes); // Follow routes
app.use('/', likeRoutes); // Like routes

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
