import express from "express";
import { Room } from "../models/Room.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to authenticate users using JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized - Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

// Route to create a new room
router.post("/create", authenticate, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Room title is required" });

    const code = Math.random().toString(36).substring(2, 8);
    const room = await Room.create({
      code,
      hostId: req.userId,
      title,
      isLocked: false,
      participants: [req.userId],
    });

    res.status(201).json(room);
  } catch (err) {
    console.error("Room creation failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to join a room
router.post("/:code/join", authenticate, async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.isLocked) return res.status(403).json({ message: "Room is locked" });

    res.status(200).json(room);
  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to lock a room (host only)
router.post("/:code/lock", authenticate, async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.hostId !== req.userId) {
      return res.status(403).json({ message: "Only host can lock the room" });
    }

    room.isLocked = true;
    await room.save();

    res.status(200).json({ message: "Room locked successfully" });
  } catch (err) {
    console.error("Error locking room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
