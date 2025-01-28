import Chat from "../models/chats.modal.js";
import { createError } from "../utils/utils.js";
import Message from "./../models/message.modal.js";
import cloudinary from "cloudinary";
const getChats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receivedId: userId }],
    })
      .populate("senderId")
      .populate("receviedId")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: { chats } || [] });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again later",
      500,
      "error",
      next
    );
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { friendId: receiverId } = req.params;
    const senderId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receivedId: receiverId },
        { senderId: receiverId, receivedId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ status: "success", data: { messages } });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again later",
      500,
      "error",
      next
    );
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { friendId: receiverId } = req.params;
    const senderId = req.user._id;
    const { text, image } = req.body;
    if (!senderId) {
      return createError("Login again - User not found", 401, "fail", next);
    }
    if (!receiverId || receiverId === senderId || receiverId === "undefined") {
      return createError(
        "Client-side error - Please provide friend ID",
        400,
        "fail",
        next
      );
    }
    if (!text && !image) {
      return next(
        createError("Message must have text or image", 400, "fail", next)
      );
    }

    // Check if chat exists between users
    const existingChat = await Chat.findOne({
      $or: [
        { senderId: senderId, receivedId: receiverId },
        { senderId: receiverId, receivedId: senderId },
      ],
    });

    if (!existingChat) {
      await Chat.create({
        senderId: senderId,
        receviedId: receiverId,
        lastMessage: "",
      });
    }

    let imageUrl;
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      imageUrl = uploadRes.secure_url;
    }

    const message = await Message.create({
      senderId: senderId,
      receviedId: receiverId,
      text: text,
      image: imageUrl,
    });

    // Update the chat's last message and timestamp
    await Chat.findOneAndUpdate(
      {
        $or: [
          { senderId: senderId, receivedId: receiverId },
          { senderId: receiverId, receivedId: senderId },
        ],
      },
      {
        lastMessage: text || imageUrl || "image",
        updatedAt: new Date(),
      },
      { new: true }
    );

    res.status(201).json({ status: "success", data: { message } });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again later",
      500,
      "error",
      next
    );
  }
};

const deleteMessage = async (req, res, next) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      return createError(
        "Message not found or already deleted",
        404,
        "fail",
        next
      );
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "error",
      next
    );
  }
};
export { getMessages, sendMessage, getChats, deleteMessage };
