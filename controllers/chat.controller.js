import prisma from "../lib/prisma.js";

// Function to get all chats for the authenticated user
export const getChats = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;

  try {
    // Fetching all chats where the user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId], // Checking if the user is part of the chat
        },
      },
    });

    // Adding receiver details to each chat
    for (const chat of chats) {
      // Finding the ID of the other participant in the chat
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

      // Fetching receiver details
      const receiver = await prisma.user.findUnique({
        where: {
          id: receiverId, // Receiver's user ID
        },
        select: {
          id: true,
          username: true,
          avatar: true, // Selecting relevant fields
        },
      });

      // Adding receiver details to the chat
      chat.receiver = receiver;
    }

    // Sending a success response with the list of chats
    res.status(200).json(chats);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

// Function to get a specific chat along with its messages
export const getChat = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;

  try {
    // Fetching the chat to ensure it exists and the user is a participant
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id, // Chat ID from the request parameters
        userIDs: {
          hasSome: [tokenUserId], // Checking if the user is part of the chat
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc", // Ordering messages by creation date
          },
        },
      },
    });

    // Updating the chat to mark it as seen by the user
    await prisma.chat.update({
      where: {
        id: req.params.id, // Chat ID from the request parameters
      },
      data: {
        seenBy: {
          push: [tokenUserId], // Adding user ID to the seenBy array
        },
      },
    });

    // Sending a success response with the chat details
    res.status(200).json(chat);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

// Function to create a new chat
export const addChat = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;

  try {
    // Creating a new chat with the authenticated user and the receiver
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, req.body.receiverId], // User IDs of participants
      },
    });

    // Sending a success response with the newly created chat
    res.status(200).json(newChat);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

// Function to mark a chat as read by the authenticated user
export const readChat = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;

  try {
    // Updating the chat to mark it as seen by the user
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id, // Chat ID from the request parameters
        userIDs: {
          hasSome: [tokenUserId], // Checking if the user is part of the chat
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId], // Setting the seenBy array to only include the user ID
        },
      },
    });

    // Sending a success response with the updated chat details
    res.status(200).json(chat);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};

// Function to delete a chat
export const deleteChat = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;

  try {
    // Fetching the chat to ensure the user is a participant
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id, // Chat ID from the request parameters
      },
      include: {
        messages: true, // Include related messages
      },
    });

    // If the chat does not exist or the user is not a participant, return 404
    if (!chat || !chat.userIDs.includes(tokenUserId)) {
      return res.status(404).json({ message: "Chat not found or user not authorized!" });
    }

    // Delete related messages
    await prisma.message.deleteMany({
      where: {
        chatId: req.params.id, // Chat ID from the request parameters
      },
    });

    // Deleting the chat
    await prisma.chat.delete({
      where: {
        id: req.params.id, // Chat ID from the request parameters
      },
    });

    // Sending a success response indicating the chat was deleted
    res.status(200).json({ message: "Chat deleted successfully!" });
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to delete chat!" });
  }
};

