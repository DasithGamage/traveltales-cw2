const likeModel = require('../models/likeModel');

const likeController = {
  like: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to like posts.',
        returnUrl: '/login'
      });
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    likeModel.addOrUpdateReaction(userId, blogId, 'like', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error liking post. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  },

  dislike: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to dislike posts.',
        returnUrl: '/login'
      });
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    likeModel.addOrUpdateReaction(userId, blogId, 'dislike', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error disliking post. Please try again.',
          returnUrl: '/'
        });
      }
      // Get the referrer URL or default to home
      const referrer = req.get('Referrer') || '/';
      res.redirect(referrer);
    });
  }
};

module.exports = likeController;