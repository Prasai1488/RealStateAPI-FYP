import express from "express";
import {
  getChats,
  getChat,
  addChat,
  readChat,
  deleteChat, // Importing the deleteChat function
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Route to get all chats for the authenticated user
router.get("/", verifyToken, getChats);

// Route to get a specific chat by ID for the authenticated user
router.get("/:id", verifyToken, getChat);

// Route to add a new chat for the authenticated user
router.post("/", verifyToken, addChat);

// Route to mark a specific chat as read by the authenticated user
router.put("/read/:id", verifyToken, readChat);

// Route to delete a specific chat by ID for the authenticated user
router.delete("/:id", verifyToken, deleteChat);

export default router;
