module.exports = {
    renderMessage: (req, res, message, type = 'error', redirectUrl = null) => {
      res.render('message', {
        message: message,
        type: type,
        redirectUrl: redirectUrl
      });
    }
  };