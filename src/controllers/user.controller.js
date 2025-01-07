import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.modal.js";
import User from "../models/user.model.js";
import { isValidImage } from "../utils/ImageValidetor.js";
import { createError } from "../utils/utils.js";
import cloudinary from "./../lib/cloudinary.js";

const getUserFriends = async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) {
    return createError("Unauthorized - Login again", 401, "error", next);
  }

  try {
    const userFriends = await User.findById(userId).populate({
      path: "friends._id",
      select: "-password -__v -email -createdAt -updatedAt",
      strictPopulate: false,
    });

    if (!userFriends) {
      return createError("User not found - Try again", 404, "error", next);
    }

    const friendsList =
      userFriends?.friends?.map((friend) => ({
        ...friend._id._doc,
        friendshipDate: new Date(friend.friendshipDate).toLocaleDateString(
          "en-EG",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ),
      })) || [];

    return res.status(200).json({
      status: "success",
      data: {
        friends: friendsList,
        total: friendsList.length,
      },
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "error",
      next
    );
  }
};

const getFriendRequests = async (req, res, next) => {
  const userId = req.user._id;
  if (!userId) {
    return createError(
      "Something went wrong - Login again",
      401,
      "error",
      next
    );
  }
  try {
    const friendRequests = await FriendRequest.find({
      receviedId: userId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "senderId", select: "-password -__v -email" })
      .exec();

    if (friendRequests.length < 1) {
      return res.status(200).json({
        status: "success",
        data: { friendRequests: [] },
        message: "No friend requests yet",
      });
    }
    return res.status(200).json({
      status: "success",
      data: {
        requests: friendRequests,
        total: friendRequests.length,
      },
    });
  } catch (error) {
    createError(
      error.message || "Something went wrong - Try again",
      500,
      "error",
      next
    );
  }
};
const sendFriendRequest = async (req, res, next) => {
  const { id } = req.body;
  const { _id } = req.user;

  if (!id) {
    return createError(
      "clinet side error - Please provide user id",
      400,
      "fail",
      next
    );
  }
  if (!_id) {
    return createError(
      "Something went wrong - Login again",
      401,
      "error",
      next
    );
  }
  if (_id === id) {
    return createError(
      "You cannot send friend request to yourself",
      400,
      "fail"
    );
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return createError("User not found - Try again", 400, "fail", next);
    }
    const sender = await User.findById(_id);
    if (!sender) {
      return createError(
        "Something went wrong - Login again",
        401,
        "error",
        next
      );
    }
    if (sender.friends?.includes(id)) {
      return createError("You are already friends with this user", 400, "fail");
    }
    const checkIsExist = await FriendRequest.findOne({
      senderId: user._id,
      receviedId: sender._id,
      status: "pending",
    });

    if (checkIsExist) {
      user.friends?.push(sender._id);
      sender.friends?.push(user._id);
      await user.save();
      await sender.save();
      checkIsExist.status = "accepted";
      await checkIsExist.save();
      return res.status(200).json({
        status: "success",
        message: "request accepted",
      });
    }
    const friendRequest = await FriendRequest.create({
      senderId: sender._id,
      receviedId: user._id,
      status: "pending",
    });
    if (!friendRequest) {
      return createError(
        "Something went wrong -  Try again",
        500,
        "error",
        next
      );
    }
    return res.status(201).json({
      status: "success",
      data: { friendRequest },
      message: "request sent",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong.",
      500,
      "fail",
      next
    );
  }
};
const acceptFriendRequest = async (req, res, next) => {
  const { requestId } = req.params;
  const { _id } = req.user;

  if (!requestId) {
    return createError(
      "client side error - Please provide request id",
      400,
      "fail",
      next
    );
  }
  if (!_id) {
    return createError(
      "Something went wrong - Login again",
      401,
      "error",
      next
    );
  }

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return createError(
        "Request not found or already accepted",
        400,
        "fail",
        next
      );
    }

    const receiver = await User.findById(_id);
    if (!receiver) {
      return createError(
        "Something went wrong - Login again",
        401,
        "error",
        next
      );
    }

    const sender = await User.findById(friendRequest.senderId);
    if (!sender) {
      return createError(
        "Something went wrong - Try again",
        400,
        "error",
        next
      );
    }
    receiver.friends.push(friendRequest.senderId);
    sender.friends.push(friendRequest.receviedId);
    await receiver.save();
    await sender.save();
    friendRequest.status = "accepted";
    await friendRequest.save();
    return res.status(200).json({
      status: "success",
      data: { friendRequest },
      message: "Friend request accepted successfully",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong.",
      500,
      "fail",
      next
    );
  }
};
const rejectFriendRequest = async (req, res, next) => {
  const { requestId } = req.params;

  if (!requestId) {
    return createError(
      "client side error - Please provide request id",
      400,
      "error",
      next
    );
  }
  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return createError(
        "Request not found or already rejected",
        400,
        "error",
        next
      );
    }
    friendRequest.status = "rejected";
    await friendRequest.save();
    return res.status(200).json({
      status: "success",
      message: "request rejected",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "error",
      next
    );
  }
};

const cancelFriendRequest = async (req, res, next) => {
  const { userId } = req.params;
  const { _id } = req.user;
  if (!userId) {
    return createError(
      "client side error - Please Provide user id",
      400,
      "fail",
      next
    );
  }
  try {
    const Request = await FriendRequest.findOneAndDelete({
      senderId: _id,
      receviedId: userId,
      status: "pending",
    });

    if (!Request) {
      return createError(
        "Request not found or already canceled",
        400,
        "fail",
        next
      );
    }
    await Request.save();
    res.status(200).json({
      status: "deleted",
      message: "Request is canceled ",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong.",
      500,
      "fail",
      next
    );
  }
};
const removeFriend = async (req, res, next) => {
  const { friendId } = req.params;
  const { _id } = req.user;
  if (!friendId) {
    return createError(
      "client side error - Please provide friend id",
      400,
      "fail",
      next
    );
  }

  try {
    const user = await User.findById(_id);
    if (!user) {
      return createError(
        "Something went wrong - Login again",
        401,
        "fail",
        next
      );
    }
    const friend = await User.findById(friendId);
    if (!friend) {
      return createError("User not found - Try again", 400, "fail", next);
    }
    if (!user.friends.includes(friendId)) {
      return createError("User is not your friend", 400, "fail", next);
    }
    if (friend.friends.includes(_id)) {
      friend.friends.pull(_id);
      await friend.save();
      user.friends.pull(friendId);
      await user.save();
      return res.status(200).json({
        status: "success",
        message: "Friend removed",
      });
    }
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "fail",
      next
    );
  }
};
const updateProfileAvatar = async (req, res, next) => {
  const { avatar } = req.body;
  const { _id } = req.user;

  if (!avatar) {
    return createError(
      " client side error - Please provide an avatar",
      400,
      "error",
      next
    );
  }

  if (!_id) {
    return createError(
      "Something went wrong - Login again",
      401,
      "error",
      next
    );
  }
  if (!isValidImage(avatar)) {
    return createError(
      "Invalid file type - Please upload a valid image type",
      415,
      "error",
      next
    );
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(avatar, {
      folder: "user_avatars",
      public_id: `avatar_${_id}`,
      overwrite: true,
      allowed_formats: ["jpg", "png", "jpeg"],
    });
    if (!uploadRes || !uploadRes.secure_url) {
      return createError(
        "Failed to upload avatar - Try again",
        500,
        "error",
        next
      );
    }
    const userUpdated = await User.findByIdAndUpdate(
      _id,
      { avatar: uploadRes.secure_url },
      { new: true, runValidators: true }
    ).select("-password");
    if (!userUpdated) {
      return createError(
        "Something went wrong - Login again",
        401,
        "error",
        next
      );
    }
    await userUpdated.save();
    res.status(200).json({
      status: "success",
      data: { user: userUpdated },
      message: "profile picutre updated successfully",
    });
  } catch (error) {
    if (error.name === "CloudinaryError") {
      return createError(
        "Cloudinary service error - Try again later",
        503,
        "fail",
        next
      );
    }
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "fail",
      next
    );
  }
};
const updateProfileName = async (req, res, next) => {
  const { username } = req.body;
  const { _id } = req.user;
  if (!username) {
    return res.status(400).json({
      status: "fail",
      message: "client side error - Please provide a username",
    });
  }

  try {
    const userUpdated = await User.findByIdAndUpdate(
      _id,
      { username },
      { new: true }
    ).select("-password");
    if (!userUpdated) {
      return createError(
        "something went wrong - Login again",
        401,
        "error",
        next
      );
    }
    await userUpdated.save();
    res.status(200).json({
      status: "success",
      data: { user: userUpdated },
      message: "profile name updated successfully",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "fail",
      next
    );
  }
};
const searchNewFriends = async (req, res, next) => {
  const { username } = req.body;
  if (!username) {
    return createError(
      "client side error - Please provide username",
      400,
      "fail"
    );
  }
  try {
    const users = await User.find({
      _id: { $ne: req.user._id, $nin: req.user.friends },
      username: { $regex: username, $options: "i" },
    }).select(["-password", "-__v", "-email"]);
    if (!users) {
      return res.status(204).json({ status: "success", message: " Not found" });
    }
    res.status(200).json({ status: "success", data: { users } });
  } catch (error) {
    return createError(
      error.message || "Something went wrong.",
      500,
      "fail",
      next
    );
  }
};

const discoverNewFriends = async (req, res, next) => {
  const { _id } = req.user;

  if (!_id) {
    return createError("Something went wrong - Login again", 401, "fail");
  }

  try {
    let users = await User.find({
      _id: { $ne: _id, $nin: req.user.friends },
    }).select("-password -__v -email");

    const PendingRequests = await FriendRequest.find({
      $or: [{ senderId: _id }, { receviedId: _id }],
      status: "pending",
    });

    users = users.map((user) => {
      const isPending = PendingRequests.some(
        (req) => req.receviedId.toString() === user._id.toString()
      );
      const isReceivedRequest = PendingRequests.some(
        (req) => req.senderId.toString() === user._id.toString()
      );
      const isFriend = req.user.friends.some(
        (id) => id._id.toString() === user._id
      );

      return {
        ...user.toObject(),
        isPending,
        isReceivedRequest,
        isFriend,
      };
    });

    if (users.length === 0) {
      return res.status(204).json({ status: "success", data: { users: [] } });
    }

    return res.status(200).json({
      status: "success",
      data: { users },
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong - Try again",
      500,
      "fail",
      next
    );
  }
};

export {
  getUserFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  updateProfileAvatar,
  updateProfileName,
  rejectFriendRequest,
  removeFriend,
  searchNewFriends,
  discoverNewFriends,
  cancelFriendRequest,
};
