import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import adminRoute from "./routes/admin.route.js";
import testimonialRoute from "./routes/testimonial.route.js";
import resetRoute from "./routes/reset.password.route.js";

const app = express();

// Middleware to enable Cross-Origin Resource Sharing (CORS) with specific settings
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Middleware to parse JSON bodies in incoming requests
app.use(express.json());

// Middleware to parse cookies in incoming requests
app.use(cookieParser());

// Route for authentication-related operations
app.use("/api/auth", authRoute);

// Route for user-related operations
app.use("/api/users", userRoute);

// Route for post-related operations
app.use("/api/posts", postRoute);

// Route for test-related operations
app.use("/api/test", testRoute);

// Route for chat-related operations
app.use("/api/chats", chatRoute);

// Route for message-related operations
app.use("/api/messages", messageRoute);

// Route for admin-related operations
app.use("/api/admin", adminRoute);

// Route for testimonials related operations
app.use("/api/testimonials", testimonialRoute);

// Route for password reset operations

app.use("/api/reset", resetRoute);

// Starting the server on port 8800 and logging a message to the console
app.listen(8800, () => {
  console.log("Server is running!");
});
