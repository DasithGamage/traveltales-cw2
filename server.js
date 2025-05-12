/**
 * TravelTales - Server Entry Point
 * Main application file that initializes the Express server,
 * configures middleware, and sets up routes
 */
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// ==========================================
// Import Route Modules
// ==========================================
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const followRoutes = require('./routes/followRoutes');
const likeRoutes = require('./routes/likeRoutes');
const apiRoutes = require('./routes/apiRoutes'); // API routes for external applications

// ==========================================
// View Engine Configuration
// ==========================================
// Set up EJS as the template engine
app.set('view engine', 'ejs');
// Set the directory for view templates
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// Middleware Configuration
// ==========================================
// Parse URL-encoded request bodies (form submissions)
app.use(express.urlencoded({ extended: true }));
// Parse JSON request bodies (API requests)
app.use(express.json());

// Serve static files (CSS, JS, images) from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// Session Configuration
// ==========================================
app.use(session({
  secret: 'your-secret-key', // Used for signing the session ID cookie
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: { maxAge: 3600000 } // Session expires after 1 hour (in milliseconds)
}));

// Make session data available to all views
// This middleware runs on every request
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ==========================================
// Route Registration
// ==========================================
// IMPORTANT: Order matters for route registration!
// More specific routes should come before general ones

// Blog routes first (includes /search for blogs)
// These handle the main content of the application
app.use('/', blogRoutes);

// Auth routes second - handles user authentication
app.use('/', authRoutes);

// User following system routes
app.use('/', followRoutes);

// Blog likes and dislikes routes
app.use('/', likeRoutes);

// API routes with /api prefix
// These provide data access for external applications
app.use('/api', apiRoutes);

// ==========================================
// Error Handling
// ==========================================

// 404 Error handler for routes not found
app.use((req, res, next) => {
  res.status(404).render('error', {
    message: 'Page not found',
    returnUrl: '/'
  });
});

// Global error handler for unexpected errors
app.use((err, req, res, next) => {
  // Log the error details for debugging
  console.error(err.stack);
  
  // Render a user-friendly error page
  res.status(500).render('error', {
    message: 'Something went wrong! Please try again later.',
    returnUrl: '/'
  });
});

// ==========================================
// Server Initialization
// ==========================================

// Set the port from environment variable or use 3000 as default
const PORT = process.env.PORT || 3000;

// Start the server and listen on the configured port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});