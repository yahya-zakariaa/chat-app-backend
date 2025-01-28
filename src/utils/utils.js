import jwt from "jsonwebtoken";
export const generateJWT = (userId, res, next) => {
  if (!userId) {
    return createError("User not found", 404, "error", next);
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });

  try {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
    });
  } catch (error) {
    return createError(
      error.message || "Something went wrong",
      500,
      "error",
      next
    );
  }
  return token;
};

export const createError = (
  msg = "Something went wrong",
  status = 500,
  statusType = "error",
  next
) => {
  const error = new Error(msg);
  error.status = status;
  error.statusType = statusType;
  return next(error);
};
