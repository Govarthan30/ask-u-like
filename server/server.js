import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://ask-u-like-gova.onrender.com/", credentials: true }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "https://ask-u-like-gova.onrender.com/", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "ask-u-like-secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Models
const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hostId: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model("Room", roomSchema);

const messageSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://ask-u-like.onrender.com/api/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Auth Routes
app.get("/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.redirect(`https://ask-u-like-gova.onrender.com//dashboard?token=${token}`);
  }
);

// JWT Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Routes
app.post("/api/room/create", authenticate, async (req, res) => {
  try {
    const code = Math.random().toString(36).substring(2, 8);
    const newRoom = await Room.create({
      code,
      title: req.body.title || "Untitled Room",
      hostId: req.userId
    });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Room creation failed", error });
  }
});

app.post("/api/room/:code/join", authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.isLocked) return res.status(403).json({ message: "Room is locked" });
    res.status(200).json({ room });
  } catch (err) {
    res.status(500).json({ message: "Join failed", err });
  }
});

app.post("/api/room/:code/lock", authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room || room.hostId !== req.userId)
      return res.status(403).json({ message: "Not authorized" });
    room.isLocked = true;
    await room.save();
    res.status(200).json({ message: "Room locked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Lock failed", err });
  }
});

app.get("/api/room/:code/messages", authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const messages = await Message.find({ roomCode: req.params.code }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", err });
  }
});

// Socket.IO
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomCode, username }) => {
    socket.join(roomCode);
    socket.to(roomCode).emit("message", {
      username: "System",
      text: `${username} has joined the room.`,
      createdAt: new Date()
    });
  });

  socket.on("send-message", async ({ roomCode, username, text }) => {
    const newMsg = await Message.create({ roomCode, username, text });
    io.to(roomCode).emit("message", newMsg);
  });
});

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => console.error("❌ MongoDB error:", err));
