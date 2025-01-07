import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { createError } from "../utils/utils.js";

const protectedRoute = async (req, res, next) => {
  const token = req.cookies.token;
  try {
    if (!token) {
      return createError("Unauthorized - Login first ", 401, "error", next);
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decodedToken) {
      return createError("Unauthorized - Invalid token", 401, "error", next);
    }

    if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
      return createError("Unauthorized - Token expired", 401, "error", next);
    }

    const user = await User.findById(decodedToken.userId).select([
      "-password",
      "-__v",
    ]);
    if (!user) {
      return createError("Unauthorized - Login again", 401, "error", next);
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("error in protectedRoute middleware", error);
    req.user = null;
    return createError(
      "Something went wrong - Login again",
      500,
      "error",
      next
    );
  }
};

export default protectedRoute;
