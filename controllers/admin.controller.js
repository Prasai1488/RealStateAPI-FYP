import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

// Middleware to check if the user is an admin

export const shouldBeAdmin = async (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "Not Authenticated!" });
    }
  
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
      if (err) {
        console.log("Token verification failed:", err);
        return res.status(403).json({ message: "Token is not Valid!" });
      }
  
      try {
        console.log("Token payload:", payload);
        const userId = payload.id; // Use the string as is from the payload
  
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
  
        if (!user) {
          console.log("User not found with ID:", userId);
          return res.status(403).json({ message: "Not authorized!" });
        }
  
        if (user.role !== "admin") {
          console.log("User is not admin:", user.role);
          return res.status(403).json({ message: "Not authorized!" });
        }
  
        req.userId = user.id; // Set user ID in request object for further use
        next();
      } catch (error) {
        console.log("Error finding user:", error);
        return res.status(400).json({ message: "Invalid User ID!" });
      }
    });
  };




// Controller to get all users and their posts
export const getAllUsersAndPosts = async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          posts: {
            include: {
              postDetail: true, // Include postDetail in the response
            },
          },
        },
      });
      res.json(users);
    } catch (error) {
      console.log("Error retrieving users and posts:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

// Controller to approve a post
export const approvePost = async (req, res) => {
  try {
    const postId = new ObjectId(req.params.postId);
    const post = await prisma.post.update({
      where: { id: postId },
      data: { approved: true },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Controller to reject a post
export const rejectPost = async (req, res) => {
    try {
      const postId = req.params.postId;
  
      // Validate the format of the post ID
      if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: "Invalid Post ID" });
      }
  
      // Fetch the post to get the related PostDetail ID
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { postDetail: true },
      });
  
      // If the post is not found, return a 404 response
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      // Delete the related PostDetail first, if it exists
      if (post.postDetail) {
        await prisma.postDetail.delete({
          where: { id: post.postDetail.id },
        });
      }
  
      // Delete the post
      await prisma.post.delete({
        where: { id: postId },
      });
  
      // Sending a success response indicating the post was deleted
      res.status(200).json({ message: "Post rejected and deleted" });
    } catch (error) {
      // Logging the error for debugging purposes
      console.error("Error rejecting post:", error);
      res.status(500).json({ error: "Server error" });
    }
  };