import express from "express";
import { Note } from "../models/Note.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title = "Untitled Note" } = req.body;
    const note = await Note.create({ title });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const notes = await Note.find({}).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { content = "", title } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.versions.push({
      content: note.content || "",
      timestamp: note.updatedAt || new Date(),
    });

    note.content = content;
    if (typeof title === "string") {
      note.title = title;
    }
    note.updatedAt = new Date();

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/versions", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const versions = (note.versions || []).slice().reverse();
    res.json(versions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/versions/restore", async (req, res) => {
  try {
    const { timestamp } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const version = note.versions.find(
      (v) => v.timestamp.toISOString() === timestamp
    );
    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    note.versions.push({
      content: note.content || "",
      timestamp: note.updatedAt || new Date(),
    });

    note.content = version.content;
    note.updatedAt = new Date();
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
