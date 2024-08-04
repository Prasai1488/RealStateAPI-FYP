import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

// Controller to get a list of posts based on query parameters
export const getPosts = async (req, res) => {
  const query = req.query;
  console.log("Received query parameters:", query);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 5;
  const skip = (page - 1) * limit;

  const propertyStatusMap = {
    available: "Available",
    booked: "Booked",
    soldout: "SoldOut"
  };
  
  const propertyStatus = query.propertyStatus 
    ? propertyStatusMap[query.propertyStatus.toLowerCase()]
    : undefined;

  try {
    // Fetching posts from the database based on the query parameters
    const posts = await prisma.post.findMany({
      where: {
        approved: true,
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        postDetail: {
          propertyStatus: propertyStatus || undefined,
        },
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
      skip: skip,
      take: limit,
      include: {
        postDetail: true,
      },
    });

    

    // Fetching the total count of posts for pagination
    const totalPosts = await prisma.post.count({
      where: {
        approved: true,
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        postDetail: {
          propertyStatus: propertyStatus || undefined,
        },
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

   

    // Sending a success response with the retrieved posts
    res.status(200).json({
      posts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};






// get single post details
export const getPost = async (req, res) => {
  const id = req.params.id;

  try {
    // Fetching the post by ID, including related post details and user information
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Extracting token from cookies if available
    const token = req.cookies?.token;

    if (token) {
      // Verifying the token
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) {
          return res.status(200).json({ ...post, isSaved: false });
        }

        // Checking if the post is saved by the authenticated user
        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              postId: id,
              userId: payload.id,
            },
          },
        });

        // Allow access to the post if the user is the owner or an admin
        if (
          post.userId === payload.id ||
          payload.role === "admin" ||
          post.approved
        ) {
          return res
            .status(200)
            .json({ ...post, isSaved: saved ? true : false });
        } else {
          return res
            .status(403)
            .json({ message: "Not authorized to view this post" });
        }
      });
    } else if (post.approved) {
      // Allow access to approved posts without authentication
      return res.status(200).json({ ...post, isSaved: false });
    } else {
      return res
        .status(403)
        .json({ message: "Not authorized to view this post" });
    }
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

// Controller to add a new post
export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    // Creating a new post with the provided data
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        approved: false, // Set approved to false by default
        postDetail: {
          create: body.postDetail,
        },
      },
    });

    // Sending a success response with the created post
    res.status(200).json(newPost);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// Controller to update an existing post by ID
export const updatePost = async (req, res) => {
  const id = req.params.id;
  const { postData, postDetail } = req.body;

  try {
    // Updating the post with the provided data, including upserting the post details
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        postDetail: {
          upsert: {
            create: postDetail,
            update: postDetail,
          },
        },
      },
    });

    // Sending a success response with the updated post
    res.status(200).json(updatedPost);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to update post" });
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

    // If the authenticated user is not the owner of the post, return a 403 response
    if (post.userId !== tokenUserId) {
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
