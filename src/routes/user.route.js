import express from "express";
import protectedRoute from "../middleware/auth.middleware.js";
import {
  updateProfileAvatar,
  updateProfileName,
  getUserFriends,
  getFriendRequests,
  searchNewFriends,
  discoverNewFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  cancelFriendRequest,
} from "../controllers/user.controller.js";
const router = express.Router();

// user friendship
router.get("/discover-new-friends", protectedRoute, discoverNewFriends);
router.get("/get-friend-requests", protectedRoute, getFriendRequests);
router.get("/get-friends", protectedRoute, getUserFriends);
router.post("/search-new-friends", protectedRoute, searchNewFriends);
router.post("/send-friend-request", protectedRoute, sendFriendRequest);
router.post(
  "/accept-friend-request/:requestId",
  protectedRoute,
  acceptFriendRequest
);
router.post(
  "/reject-friend-request/:requestId",
  protectedRoute,
  rejectFriendRequest
);
router.delete("/remove-friend/:friendId", protectedRoute, removeFriend);
router.delete(
  "/cancel-friend-request/:userId",
  protectedRoute,
  cancelFriendRequest
);

// user profile
router.put("/update-profile", protectedRoute, updateProfileAvatar);
router.put("/update-username", protectedRoute, updateProfileName);

export default router;
