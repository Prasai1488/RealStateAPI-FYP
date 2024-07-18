import jwt from "jsonwebtoken";

// The code provided is a middleware function in an Express.js application that verifies the presence and validity of a JWT (JSON Web Token) from the cookies of incoming requests. If the token is valid, it allows the request to proceed to the next middleware or route handler; otherwise, it responds with an error.

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not Valid!" });
    req.userId = payload.id;

    next();
  });
};