// middleware/apiAuth.js
const apiKeyAuth = (req, res, next) => {
  // Check for API key in headers or query parameters
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // List of valid API keys (in production, store in database)
  const validApiKeys = [
    'abc123-def456-ghi789',  // Example API key
    'xyz987-wvu654-tsr321'   // Another example API key
  ];
  
  // If no API key provided
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in x-api-key header'
    });
  }
  
  // If API key is invalid
  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // API key is valid, continue to the next middleware
  next();
};

module.exports = apiKeyAuth;