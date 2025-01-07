import { Server } from "socket.io";
import http from "http";
import express from "express";

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

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

export { io, server, app };
