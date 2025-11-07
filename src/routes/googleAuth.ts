import express, { Request, Response } from "express";
import axios from "axios";
import querystring from "querystring";
import { OAuth2Client } from "google-auth-library";
import { findUserByEmail, createUser } from "../models/userModel";
import { generateToken } from "../utils/generateToken";

const router = express.Router();

// ---- Google OAuth Config ----
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const SCOPE = ["openid", "email", "profile"].join(" ");

// ========================================================
// 🌐 1️⃣ WEB FLOW: Redirect user to Google
// ========================================================
router.get("/google", (req: Request, res: Response) => {
  const params = querystring.stringify({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.redirect(googleAuthUrl);
});

// ========================================================
// 🌐 2️⃣ WEB FLOW: Handle Google callback
// ========================================================
router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).json({ message: "Missing authorization code" });

  try {
    // 1️⃣ Exchange the code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { id_token } = tokenResponse.data;
    if (!id_token) throw new Error("No id_token returned by Google");

    // 2️⃣ Verify and decode the ID token
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("Failed to verify Google ID token");

    const { email, name, sub: googleId } = payload;
    if (!email) throw new Error("Google account has no email");

    // 3️⃣ Check if user already exists
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        name: name || "Google User",
        password: null,
        provider: "google",
        provider_id: googleId,
      });
    }

    // 4️⃣ Generate JWT (same as your normal auth)
    const token = generateToken(String(user.id!));

    // 5️⃣ Send response (or redirect to frontend)
    res.json({ token, user });
  } catch (err: any) {
    console.error("❌ Google login failed:", err.response?.data || err.message);
    res.status(500).json({ message: "Google login failed", error: err.message });
  }
});

// ========================================================
// 📱 3️⃣ MOBILE / DESKTOP FLOW (Flutter uses this)
// ========================================================
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");

    const { email, name, sub: googleId } = payload;
    if (!email) throw new Error("Google account has no email");

    // Find or create user
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        name: name || "Google User",
        password: null,
        provider: "google",
        provider_id: googleId,
      });
    }

    // Generate JWT
    const jwt = generateToken(String(user.id!));

    console.log("✅ Google login (mobile/desktop):", email);

    res.json({ token: jwt, user });
  } catch (err: any) {
    console.error("❌ Mobile Google login failed:", err.message);
    res.status(500).json({ message: "Google login failed", error: err.message });
  }
});

export default router;
