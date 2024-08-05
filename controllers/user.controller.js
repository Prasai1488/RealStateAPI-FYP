import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// api to get all users
export const getUsers = async (req, res) => {
  try {
    // get users from database
    const users = await prisma.user.findMany();
    // return users
    res.status(200).json(users);
  } catch (err) {
    // handle error
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true, // Ensure role is included
        avatar: true,
        createdAt: true,
        // Add other fields as necessary
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json(rest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update users!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    console.log("Not Authorized");
    return res.status(403).json({ message: "Not Authorized!" });
  }

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

    // Step 7: Delete related testimonials
    await prisma.testimonial.deleteMany({
      where: { userId: id },
    });

    // Step 8: Delete the user
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};





export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete users!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    // Fetch user posts with post details
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
      include: {
        postDetail: true,
      },
    });

    // Fetch saved posts with post details
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: {
          include: {
            postDetail: true,
          },
        },
      },
    });

    // Extract posts from saved posts
    const savedPosts = saved.map((item) => item.post);

    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};


export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
        NOT: {
          seenBy: {
            hasSome: [tokenUserId],
          },
        },
      },
    });
    res.status(200).json(number);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};