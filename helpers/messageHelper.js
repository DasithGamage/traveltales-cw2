/**
 * Message Helper Module
 * Provides utility functions for rendering standardized message screens
 * Used throughout the application for user feedback and notifications
 */
module.exports = {
  /**
   * Render a message screen with standardized formatting
   * Supports different message types (success, error, info) with appropriate styling
   * Can include a redirect URL for navigation after displaying the message
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} message - The message text to display to the user
   * @param {string} type - Message type: 'error', 'success', or 'info' (defaults to 'error')
   * @param {string|null} redirectUrl - URL to redirect to after showing message (optional)
   */
  renderMessage: (req, res, message, type = 'error', redirectUrl = null) => {
    // Render the message view with the provided parameters
    res.render('message', {
      message: message,  // Text content of the message
      type: type,        // Determines the styling (colors, icons)
      redirectUrl: redirectUrl  // Where to go next (null shows a "Go Back" button)
    });
  }
};