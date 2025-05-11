const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const followRoutes = require('./routes/followRoutes');
const likeRoutes = require('./routes/likeRoutes');

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Set up session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Make session available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Routes - IMPORTANT: blogRoutes must come before authRoutes
app.use('/', blogRoutes);     // Blog routes first (includes /search for blogs)
app.use('/', authRoutes);     // Auth routes second
app.use('/', followRoutes);
app.use('/', likeRoutes);

// 404 Error handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    message: 'Page not found',
    returnUrl: '/'
  });
});

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Something went wrong! Please try again later.',
    returnUrl: '/'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});