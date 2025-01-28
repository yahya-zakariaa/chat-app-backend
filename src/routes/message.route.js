import express from "express";
import protectedRoute from "../middleware/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  getChats,
  deleteMessage,
} from "../controllers/message.controller.js";
const router = express.Router();

router.get("/", protectedRoute, getChats);
router.get("/get-messages/:friendId", protectedRoute, getMessages);
router.post("/send-message/:friendId", protectedRoute, sendMessage);
router.delete("/delete-message/:messageId", protectedRoute, deleteMessage);

export default router;
