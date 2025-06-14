import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  googleId: String,
  joinedRooms: [String],
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
