const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const messageHelper = require('../helpers/messageHelper');

/**
 * Authentication Controller
 * Handles user registration, login, password management and profile updates
 * Uses bcrypt for secure password hashing and verification
 */
const authController = {
  /**
   * Display the user registration page
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  showRegisterPage: (req, res) => {
    res.render('register');
  },

  /**
   * Process user registration form submission
   * Creates a new user account and security questions for password recovery
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  registerUser: (req, res) => {
    const { name, email, password, answer1, answer2, answer3 } = req.body;

    // Validate that all required fields are provided
    if (!name || !email || !password || !answer1 || !answer2 || !answer3) {
      return messageHelper.renderMessage(req, res, 'All fields are required', 'error', '/register');
    }

    // Check if email already exists in the database
    userModel.checkEmailExists(email, (err, user) => {
      if (err) {
        console.error(err);
        return messageHelper.renderMessage(req, res, 'Server error. Please try again.', 'error');
      }

      if (user) {
        return messageHelper.renderMessage(req, res, 'Email already registered. Please log in or use another email.', 'error', '/register');
      }

      // Hash the password for secure storage
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Create the new user account
      userModel.createUser(name, email, hashedPassword, (err, result) => {
        if (err) {
          console.error(err);
          return messageHelper.renderMessage(req, res, 'Registration failed.', 'error');
        }
        
        const userId = result.lastID;
        // Save security questions for password recovery
        userModel.saveSecurityQuestions(userId, answer1, answer2, answer3, (err) => {
          if (err) {
            console.error(err);
            return messageHelper.renderMessage(req, res, 'Failed to save security questions.', 'error');
          }
          // Redirect to login page with success flag
          res.redirect('/login?registered=true');
        });
      });
    });
  },

  /**
   * Display the login page
   * Passes query parameters to the view for displaying messages
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  loginPage: (req, res) => {
    res.render('login', { query: req.query });
  },

  /**
   * Process login form submission
   * Validates credentials and creates a user session if valid
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  loginUser: (req, res) => {
    const { email, password } = req.body;

    // Validate that both email and password were provided
    if (!email || !password) {
      return messageHelper.renderMessage(req, res, 'Please enter both email and password.', 'error', '/login');
    }

    // Find the user by email address
    userModel.findUserByEmail(email, (err, user) => {
      if (!user) {
        return messageHelper.renderMessage(req, res, 'Invalid email.', 'error', '/login');
      }

      // Verify the provided password against the stored hash
      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        return messageHelper.renderMessage(req, res, 'Incorrect password.', 'error', '/login');
      }

      // Create a session for the authenticated user
      // Note: We only store non-sensitive info in the session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      // Redirect to the homepage after successful login
      res.redirect('/');
    });
  },

  /**
   * Process user logout
   * Destroys the current session and redirects to login page
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logoutUser: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return messageHelper.renderMessage(req, res, 'Error logging out.', 'error');
      }
      res.redirect('/login');
    });
  },

  /**
   * Update user profile information
   * Handles name and email changes, validates session
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    const { name, email } = req.body;
    userModel.updateUser(req.session.user.id, name, email, (err) => {
      if (err) {
        return messageHelper.renderMessage(req, res, 'Error updating profile', 'error', '/profile');
      }
      
      // Update session data to reflect changes
      req.session.user.name = name;
      req.session.user.email = email;
      
      messageHelper.renderMessage(req, res, 'Profile updated successfully!', 'success', '/profile');
    });
  },

  /**
   * Change user password
   * Requires current password verification before changing
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Verify that new password and confirmation match
    if (newPassword !== confirmPassword) {
      return messageHelper.renderMessage(req, res, 'Passwords do not match', 'error', '/profile');
    }
    
    // Verify current password before allowing change
    userModel.findUserByEmail(req.session.user.email, (err, user) => {
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return messageHelper.renderMessage(req, res, 'Current password is incorrect', 'error', '/profile');
      }
      
      // Hash the new password before storing
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      userModel.updatePassword(user.email, hashedPassword, (err) => {
        if (err) {
          return messageHelper.renderMessage(req, res, 'Error changing password', 'error', '/profile');
        }
        
        // Destroy session after password change for security
        // Forces user to log in with new password
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
          messageHelper.renderMessage(req, res, 'Password changed successfully! Please log in with your new password.', 'success', '/login');
        });
      });
    });
  },

  /**
   * First step of password recovery - verify email exists
   * If valid, shows security questions form
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyEmail: (req, res) => {
    const { email } = req.body;
    userModel.findUserByEmail(email, (err, user) => {
      if (!user) {
        return messageHelper.renderMessage(req, res, 'Email not found', 'error', '/forgot-password');
      }
      
      // Show security questions form for the verified email
      res.render('security-questions', { email });
    });
  },

  /**
   * Process security answers and reset password
   * Generates a temporary password if answers are correct
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetPassword: (req, res) => {
    const { email, answer1, answer2, answer3 } = req.body;
    
    // Verify security question answers
    userModel.verifySecurityAnswers(email, answer1, answer2, answer3, (err, isValid) => {
      if (!isValid) {
        return messageHelper.renderMessage(req, res, 'Security answers are incorrect', 'error', '/forgot-password');
      }
      
      // Generate a temporary password
      // In a production app, you might want to generate a random password
      const newPassword = 'TempPassword123';
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      // Update user's password
      userModel.updatePassword(email, hashedPassword, (err) => {
        if (err) {
          return messageHelper.renderMessage(req, res, 'Error resetting password', 'error');
        }
        
        // Display the temporary password to the user
        // In production, you would typically email this instead
        messageHelper.renderMessage(req, res, `Password reset successful. Your new password is: ${newPassword}. Please change it after logging in.`, 'success', '/login');
      });
    });
  }
};

module.exports = authController;