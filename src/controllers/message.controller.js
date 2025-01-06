import User from "../models/user.model.js";
import { createError } from "../utils/utils.js";
import Message from "./../models/message.modal.js";

const getMessages = async (req, res) => {
  try {
    const { id: reseverId } = req.params;
    const senderId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId, receviedId: reseverId },
        { senderId: reseverId, receviedId: senderId },
      ],
    });

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
    const { id: reseverId } = req.params;
    const senderId = req.user._id;
    const { text, image } = req.body;
    let imageUrl;
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      imageUrl = uploadRes.secure_url;
    }

    const message = await Message.create({
      senderId,
      receviedId: reseverId,
      text,
      image: imageUrl,
    });
    await message.save();
    // socket io code ===>
  } catch (error) {
    return createError(
      error.message || "Something went worng - Try again later",
      500,
      "error",
      next
    );
  }
};
export { getMessages, sendMessage };
