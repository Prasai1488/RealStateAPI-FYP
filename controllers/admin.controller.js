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

      if (user.username !== "admin") {
        console.log("User is not admin:", user.username);
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



// Controller to get all users and their posts with pagination
export const getAllUsersAndPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    const [totalUsers, users] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.findMany({
        skip: offset,
        take: limit,
        include: {
          posts: {
            include: {
              postDetail: true, // Include postDetail in the response
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      totalPages,
      currentPage: page,
    });
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


  // Controller to delete a user and their related data
export const deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    // Step 1: Delete saved posts referencing the user's posts
    const userPosts = await prisma.post.findMany({
      where: { userId: id },
      select: { id: true },
    });

    const userPostIds = userPosts.map(post => post.id);

    await prisma.savedPost.deleteMany({
      where: { postId: { in: userPostIds } },
    });

    // Step 2: Delete related saved posts for the user
    await prisma.savedPost.deleteMany({
      where: { userId: id },
    });

    // Step 3: Delete related PostDetail records
    await prisma.postDetail.deleteMany({
      where: { postId: { in: userPostIds } },
    });

    // Step 4: Delete related messages
    const userChats = await prisma.chat.findMany({
      where: {
        userIDs: { has: id }
      },
      select: { id: true },
    });

    const chatIds = userChats.map(chat => chat.id);

    await prisma.message.deleteMany({
      where: { chatId: { in: chatIds } },
    });

    // Step 5: Delete related chats
    await prisma.chat.deleteMany({
      where: {
        userIDs: { has: id }
      },
    });

    // Step 6: Delete related posts
    await prisma.post.deleteMany({
      where: { userId: id },
    });

    // Step 7: Delete the user
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: "User and their related data deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};
  

// Controller to delete a post by ID
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    // Validate the format of the post ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    // Fetching the post to be deleted, including its details and saved posts
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        savedPosts: true,
      },
    });

    // If the post is not found, return a 404 response
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch the user to check if they are admin
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    // If the authenticated user is not the owner of the post and not an admin, return a 403 response
    if (post.userId !== tokenUserId && user.username !== "admin") {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    // Delete associated saved posts if any
    if (post.savedPosts.length > 0) {
      await prisma.savedPost.deleteMany({
        where: { postId: id },
      });
    }

    // Delete associated post details if any
    if (post.postDetail) {
      await prisma.postDetail.delete({
        where: { id: post.postDetail.id },
      });
    }

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    // Sending a success response indicating the post was deleted
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    // Logging the error and sending a failure response
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
