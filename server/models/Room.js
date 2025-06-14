import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  hostId: String,
  title: String,
  isLocked: { type: Boolean, default: false },
  participants: [String], // array of user IDs
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);
