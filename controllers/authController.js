const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const authController = {
  showRegisterPage: (req, res) => {
    res.render('register');
  },

  registerUser: (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.send('All fields are required');
    }

    userModel.findUserByEmail(email, (err, user) => {
      if (user) {
        return res.send('Email already registered.');
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      userModel.createUser(name, email, hashedPassword, (err) => {
        if (err) {
          console.error(err);
          return res.send('Registration failed.');
        }
        res.send('User registered successfully!');
      });
    });
  },

  loginPage: (req, res) => {
    res.render('login');
  },

  loginUser: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.send('Please enter both email and password.');
    }

    userModel.findUserByEmail(email, (err, user) => {
      if (!user) {
        return res.send('Invalid email.');
      }

      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        return res.send('Incorrect password.');
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
        return res.send('Error logging out.');
      }
      res.redirect('/login');
    });
  }
};

module.exports = authController;
