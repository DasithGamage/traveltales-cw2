const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const messageHelper = require('../helpers/messageHelper');

const authController = {
  showRegisterPage: (req, res) => {
    res.render('register');
  },

  registerUser: (req, res) => {
    const { name, email, password, answer1, answer2, answer3 } = req.body;

    if (!name || !email || !password || !answer1 || !answer2 || !answer3) {
      return messageHelper.renderMessage(req, res, 'All fields are required', 'error', '/register');
    }

    // Check if email already exists
    userModel.checkEmailExists(email, (err, user) => {
      if (err) {
        console.error(err);
        return messageHelper.renderMessage(req, res, 'Server error. Please try again.', 'error');
      }

      if (user) {
        return messageHelper.renderMessage(req, res, 'Email already registered. Please log in or use another email.', 'error', '/register');
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      userModel.createUser(name, email, hashedPassword, (err, result) => {
        if (err) {
          console.error(err);
          return messageHelper.renderMessage(req, res, 'Registration failed.', 'error');
        }
        
        const userId = result.lastID;
        // Save security questions
        userModel.saveSecurityQuestions(userId, answer1, answer2, answer3, (err) => {
          if (err) {
            console.error(err);
            return messageHelper.renderMessage(req, res, 'Failed to save security questions.', 'error');
          }
          res.redirect('/login?registered=true');
        });
      });
    });
  },

  loginPage: (req, res) => {
    res.render('login', { query: req.query });
  },

  loginUser: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return messageHelper.renderMessage(req, res, 'Please enter both email and password.', 'error', '/login');
    }

    userModel.findUserByEmail(email, (err, user) => {
      if (!user) {
        return messageHelper.renderMessage(req, res, 'Invalid email.', 'error', '/login');
      }

      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        return messageHelper.renderMessage(req, res, 'Incorrect password.', 'error', '/login');
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      res.redirect('/');
    });
  },

  logoutUser: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return messageHelper.renderMessage(req, res, 'Error logging out.', 'error');
      }
      res.redirect('/login');
    });
  },

  updateProfile: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    const { name, email } = req.body;
    userModel.updateUser(req.session.user.id, name, email, (err) => {
      if (err) {
        return messageHelper.renderMessage(req, res, 'Error updating profile', 'error', '/profile');
      }
      req.session.user.name = name;
      req.session.user.email = email;
      messageHelper.renderMessage(req, res, 'Profile updated successfully!', 'success', '/profile');
    });
  },

  changePassword: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return messageHelper.renderMessage(req, res, 'Passwords do not match', 'error', '/profile');
    }
    
    userModel.findUserByEmail(req.session.user.email, (err, user) => {
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return messageHelper.renderMessage(req, res, 'Current password is incorrect', 'error', '/profile');
      }
      
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      userModel.updatePassword(user.email, hashedPassword, (err) => {
        if (err) {
          return messageHelper.renderMessage(req, res, 'Error changing password', 'error', '/profile');
        }
        // Destroy session after password change to force re-login
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
          messageHelper.renderMessage(req, res, 'Password changed successfully! Please log in with your new password.', 'success', '/login');
        });
      });
    });
  },

  verifyEmail: (req, res) => {
    const { email } = req.body;
    userModel.findUserByEmail(email, (err, user) => {
      if (!user) {
        return messageHelper.renderMessage(req, res, 'Email not found', 'error', '/forgot-password');
      }
      res.render('security-questions', { email });
    });
  },

  resetPassword: (req, res) => {
    const { email, answer1, answer2, answer3 } = req.body;
    
    userModel.verifySecurityAnswers(email, answer1, answer2, answer3, (err, isValid) => {
      if (!isValid) {
        return messageHelper.renderMessage(req, res, 'Security answers are incorrect', 'error', '/forgot-password');
      }
      
      // Generate a temporary password
      const newPassword = 'TempPassword123';
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      userModel.updatePassword(email, hashedPassword, (err) => {
        if (err) {
          return messageHelper.renderMessage(req, res, 'Error resetting password', 'error');
        }
        messageHelper.renderMessage(req, res, `Password reset successful. Your new password is: ${newPassword}. Please change it after logging in.`, 'success', '/login');
      });
    });
  }
};

module.exports = authController;