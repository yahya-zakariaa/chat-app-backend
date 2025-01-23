import mongoose from "mongoose";

const GlobalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  console.log(err.message, err.stack);

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: "Client side error - Try again",
    });
  }

  if (err.code === 11000 || err.code === "E11000") {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      status: "fail",
      message: `${field} '${value}' is already in use.`,
    });
  }

  if (err instanceof SyntaxError) {
    return res.status(400).json({
      status: "fail",
      message: "Client side error - Try again",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token - Login again",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "fail",
      message: "Token has expired - Login again",
    });
  }

  if (err.name === "PermissionError") {
    return res.status(403).json({
      status: "fail",
      message: " Permission denied - You don't have access this resource.",
    });
  }

  if (err.code === "ENOENT") {
    return res.status(404).json({
      status: "fail",
      message: "File not found.",
    });
  }

  if (err.code === "ETIMEDOUT") {
    return res.status(408).json({
      status: "fail",
      message: "Request timed out - try again.",
    });
  }

  if (err.code === "EAUTH") {
    return res.status(401).json({
      status: "fail",
      message: "Authentication error - Login again.",
    });
  }

  if (err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
    return res.status(500).json({
      status: "error",
      message: " Connection error - Try again later.",
    });
  }

  if (err.name === "MigrationError") {
    return res.status(500).json({
      status: "error",
      message: "Error occurred during database migration.",
    });
  }

  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({
      status: "error",
      message: "Server configuration error - Try again later.",
    });
  }

  if (err.code === "ECONNREFUSED") {
    return res.status(500).json({
      status: "error",
      message: "Failed to connect to server - Try again later.",
    });
  }

  if (err instanceof mongoose.Error) {
    return res.status(500).json({
      status: "error",
      message: "Database error occurred.",
    });
  }

  return res.status(statusCode).json({ status, message: err.message });
};

export default GlobalErrorHandler;
