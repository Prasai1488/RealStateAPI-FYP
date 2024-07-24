import jwt from "jsonwebtoken";

// The code provided is a middleware function in an Express.js application that verifies the presence and validity of a JWT (JSON Web Token) from the cookies of incoming requests. If the token is valid, it allows the request to proceed to the next middleware or route handler; otherwise, it responds with an error.

// Middleware to verify JWT token from cookies
export const verifyToken = (req, res, next) => {
  // Extract the token from cookies
  const token = req.cookies.token;

  // If no token is found, respond with an unauthorized status
  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  // Verify the token using the JWT secret key
  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    // If the token is invalid or verification fails, respond with a forbidden status
    if (err) return res.status(403).json({ message: "Token is not Valid!" });
    
    // Attach the user ID from the token payload to the request object
    req.userId = payload.id;

    // Call the next middleware function in the stack
    next();
  });
};
