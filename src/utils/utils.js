import jwt from "jsonwebtoken";
export const generateJWT = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
  });
  return token;
};

export const createError = (msg = "Something went wrong", status = 500, statusType = "error", next) => {
  const error = new Error(msg);
  error.status = status;
  error.statusType = statusType;
  return next(error);
};