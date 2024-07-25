import express from "express";
import {
  shouldBeAdmin,
  getAllUsersAndPosts,
  approvePost,
  rejectPost,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Apply shouldBeAdmin middleware to all admin routes
router.use(shouldBeAdmin);

router.get("/users", getAllUsersAndPosts);
router.post("/approve-post/:postId", approvePost);
router.post("/reject-post/:postId", rejectPost);

export default router;
