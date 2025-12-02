const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  // Format: "Bearer TOKEN"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.',
      message: 'Please include a valid JWT token in the Authorization header'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    return res.status(500).json({ 
      error: 'Token verification error',
      message: error.message
    });
  }
};

module.exports = authenticateToken;