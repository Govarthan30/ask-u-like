import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(redirectUrl);
});

router.get("/google/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { data } = await axios.post("https://oauth2.googleapis.com/token", null, {
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code,
      },
    });

    const accessToken = data.access_token;

    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { name, email, id: googleId } = userInfo.data;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("Authentication failed");
  }
});

export default router;
