const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "No authentication token, access denied" });
    }
    
    const token = authHeader.replace("Bearer ", "");
    
    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    // Provide more specific error messages
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please log in again" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token, authorization denied" });
    }
    
    res.status(401).json({ error: "Authentication failed, authorization denied" });
  }
};

module.exports = authMiddleware; 