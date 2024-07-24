import jwt from "jsonwebtoken";

// Function to check if the user is logged in
export const shouldBeLoggedIn = async (req, res) => {
  // Logging the user ID from the request for debugging purposes
  // console.log(req.userId);
  // Sending a success response indicating the user is authenticated
  res.status(200).json({ message: "You are Authenticated" });
};

// Function to check if the user is an admin
export const shouldBeAdmin = async (req, res) => {
  // Extracting the token from the cookies
  const token = req.cookies.token;

  // If no token is present, send an unauthorized response
  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    // If the token is invalid, send a forbidden response
    if (err) return res.status(403).json({ message: "Token is not Valid!" });
    
    // If the user is not an admin, send a forbidden response
    if (!payload.isAdmin) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    
    // If the token is valid and the user is an admin, send a success response
    res.status(200).json({ message: "You are Authenticated" });
  });
};
