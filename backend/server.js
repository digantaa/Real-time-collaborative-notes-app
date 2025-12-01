import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import noteRoute from "./routes/noteRoute.js";
import { Note } from "./models/Note.js";

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins =
  process.env.CLIENT_URL?.split(",").map((url) => url.trim()) ?? ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/api/notes", noteRoute);

const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
  },
});

const activeUsers = {};
const MAX_VERSIONS = 50;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.data.noteRooms = new Set();

  socket.on("join_note", ({ noteId }) => {
    if (!noteId) return;
    socket.join(noteId);
    socket.data.noteRooms.add(noteId);

    if (!activeUsers[noteId]) activeUsers[noteId] = 0;
    activeUsers[noteId]++;

    io.to(noteId).emit("active_users", activeUsers[noteId]);
  });

  socket.on("note_update", async ({ noteId, content }) => {
    if (!noteId) return;
    const note = await Note.findById(noteId);
    if (!note) return;

    note.versions.push({
      content: note.content,
      timestamp: new Date(),
    });

    if (note.versions.length > MAX_VERSIONS) {
      note.versions = note.versions.slice(-MAX_VERSIONS);
    }

    note.content = content;
    note.updatedAt = new Date();

    await note.save();

    socket.to(noteId).emit("note_update", content);
    socket.emit("last_saved", note.updatedAt);
  });

  socket.on("cursor_position", ({ noteId, cursor }) => {
    socket.to(noteId).emit("cursor_position", {
      userId: socket.id,
      cursor,
    });
  });

  socket.on("disconnect", () => {
    socket.data.noteRooms.forEach((room) => {
      activeUsers[room] = Math.max((activeUsers[room] || 1) - 1, 0);
      io.to(room).emit("active_users", activeUsers[room]);
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
