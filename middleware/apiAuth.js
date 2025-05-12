// middleware/apiAuth.js

/**
 * API Key Authentication Middleware
 * Validates API requests to ensure they contain a valid API key
 * This middleware protects all API endpoints from unauthorized access
 */
const apiKeyAuth = (req, res, next) => {
  // Retrieve API key from either request headers or query parameters
  // This provides flexibility for different API client implementations
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // List of valid API keys
  // In a production environment, these would be stored in a database
  // or environment variables rather than hard-coded
  const validApiKeys = [
    'abc123-def456-ghi789',  // Example API key (for development)
    'xyz987-wvu654-tsr321'   // Another example API key (for testing)
  ];
  
  // Check if an API key was provided in the request
  if (!apiKey) {
    // Return 401 Unauthorized if no API key is present
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in x-api-key header'
    });
  }
  
  // Validate the provided API key against our list of authorized keys
  if (!validApiKeys.includes(apiKey)) {
    // Return 403 Forbidden if API key is invalid
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // If the API key is valid, proceed to the next middleware or route handler
  // This allows the request to continue its normal flow
  next();
};

module.exports = apiKeyAuth;