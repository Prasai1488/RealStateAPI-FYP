import prisma from "../lib/prisma.js";

// Function to add a message to a chat
export const addMessage = async (req, res) => {
  // Extracting user ID from the request token
  const tokenUserId = req.userId;
  // Extracting chat ID from the request parameters
  const chatId = req.params.chatId;
  // Extracting message text from the request body
  const text = req.body.text;

  try {
    // Fetching the chat to ensure it exists and the user is a participant
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId], // Checking if the user is part of the chat
        },
      },
    });

    // If the chat does not exist or the user is not a participant, return 404
    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    // Creating a new message in the chat
    const message = await prisma.message.create({
      data: {
        text, // Message text
        chatId, // Chat ID
        userId: tokenUserId, // User ID of the sender
      },
    });

    // Updating the chat with the new message and marking it as seen by the sender
    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: [tokenUserId], // Marking the chat as seen by the sender
        lastMessage: text, // Updating the last message in the chat
      },
    });

    // Sending a success response with the created message
    res.status(200).json(message);
  } catch (err) {
    // Logging the error and sending a failure response
    console.log(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};
