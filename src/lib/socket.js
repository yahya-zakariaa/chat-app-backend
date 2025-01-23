import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "./../models/user.model.js";
import { log } from "console";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://foul-brave-harmonica.glitch.me",
      "http://d2eb9b52af3e:3000",
      "http://127.0.0.1:3000",
      "http://172.17.0.120:3000",
    ],
    credentials: true,
  },
});

const friendsCache = new Map(); // Stores { userId: { friends: [], timestamp: number } }
const onlineUsers = new Map(); // Map<userId, socketId>

// Helper function to validate userId
const isValidUserId = (userId) => {
  return userId && typeof userId === "string" && userId !== "undefined";
};

// Helper function to get friends list with cache TTL
const getFriendsList = async (userId) => {
  if (!isValidUserId(userId)) {
    console.warn("[Warning] Invalid userId in getFriendsList:", userId);
    return [];
  }

  // Check cache first
  if (friendsCache.has(userId)) {
    const entry = friendsCache.get(userId);
    // Check if cache entry is valid (5 minutes)
    if (Date.now() - entry.timestamp < 300000) {
      return entry.friends;
    }
    friendsCache.delete(userId);
  }

  try {
    const user = await User.findById(userId).populate({
      path: "friends._id",
      select: "-password -__v -email -createdAt -updatedAt",
    });

    const friendsList =
      user?.friends?.map((friend) => friend._id._id.toString()) || [];
    friendsCache.set(userId, { friends: friendsList, timestamp: Date.now() });
    return friendsList;
  } catch (error) {
    console.error(`[Error] Fetching friends list for userId ${userId}:`, error);
    return [];
  }
};

// Notify friends when a user's status changes
const notifyFriends = async (userId, status) => {
  if (!isValidUserId(userId)) return;

  try {
    const friendsList = await getFriendsList(userId);
    friendsList.forEach((friendId) => {
      const friendSocketId = onlineUsers.get(friendId);
      if (friendSocketId) {
        io.to(friendSocketId).emit("user-status-update", { userId, status });
      }
    });
  } catch (error) {
    console.error(`[Error] Notifying friends for userId ${userId}:`, error);
  }
};

// Handle user connection
const handleUserConnection = async (userId, socketId, status) => {
  if (!isValidUserId(userId) || !socketId) return;

  try {
    if (status === "online") {
      onlineUsers.set(userId, socketId);
      console.log(
        `[Connection] User ${userId} connected with socketId ${socketId}`
      );
    } else if (status === "offline") {
      onlineUsers.delete(userId);
      console.log(`[Disconnection] User ${userId} disconnected`);
      notifyFriends(userId, status);
      return;
    }

    if (status === "online") {
      const friendsList = await getFriendsList(userId);
      const onlineFriends = friendsList.filter((id) => onlineUsers.has(id));
      io.to(socketId).emit("get-online-users", onlineFriends);
      notifyFriends(userId, status);
    }
  } catch (error) {
    console.error(`[Error] Handling user connection for ${userId}:`, error);
  }
};

// Socket.IO connection handler
io.on("connection", async (socket) => {
  const { userId } = socket.handshake.query;

  if (!isValidUserId(userId)) {
    console.warn("[Warning] Connection rejected: Invalid userId.");
    socket.disconnect();
    return;
  }

  // Handle user connection
  handleUserConnection(userId, socket.id, "online");
  console.log(onlineUsers);

  socket.on("disconnect", async () => {
    handleUserConnection(userId, socket.id, "offline");
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  friendsCache.clear();
  onlineUsers.clear();
  server.close(() => {
    console.log("[Shutdown] Server closed gracefully.");
    process.exit(0);
  });
});

export { io, server, app };
