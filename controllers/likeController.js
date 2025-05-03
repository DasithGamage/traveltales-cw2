const likeModel = require('../models/likeModel');

const likeController = {
  like: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    likeModel.addOrUpdateReaction(userId, blogId, 'like', (err) => {
      if (err) {
        console.error(err);
        return res.send('Error liking post.');
      }
      res.redirect('back');
    });
  },

  dislike: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user.id;
    const blogId = parseInt(req.params.id);

    likeModel.addOrUpdateReaction(userId, blogId, 'dislike', (err) => {
      if (err) {
        console.error(err);
        return res.send('Error disliking post.');
      }
      res.redirect('back');
    });
  }
};

module.exports = likeController;
