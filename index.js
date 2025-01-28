import express from "express";
import dotenv from "dotenv";
import authRoute from "./src/routes/auth.route.js";
import messageRoute from "./src/routes/message.route.js";
import userRoute from "./src/routes/user.route.js";
import { connectDB } from "./src/lib/db.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { createError } from "./src/utils/utils.js";
import GlobalErrorHandler from "./src/middleware/GlobalErrorHandler.middleware.js";
import { server, app } from "./src/lib/socket.js";

const port = process.env.PORT || 3002;

// Load environment variables
dotenv.config();

// Set up CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://foul-brave-harmonica.glitch.me",
      "http://d2eb9b52af3e:3000",
      "http://127.0.0.1:3000",
      "http://172.17.0.120:3000",
      "https://chat-app-ten-ruddy.vercel.app",
    ],
    credentials: true, // Allow sending cookies
  })
);

// Global middlewares
app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chats", messageRoute);
app.use("/api/user", userRoute);

// Handle 404 for non-existing routes
app.all("*", (req, res, next) => {
  return next(createError("Page not found", 404, "error", next));
});

// Global error handler
app.use(GlobalErrorHandler);

// Start the server after ensuring DB connection
const startServer = async () => {
  try {
    await connectDB(); // Ensure DB connection first
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
};

startServer();
