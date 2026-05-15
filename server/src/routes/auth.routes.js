import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler, httpError } from "../utils/http.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      throw httpError(422, "Name, email and password are required.");
    }

    if (password.length < 6) {
      throw httpError(422, "Password must be at least 6 characters.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw httpError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({
      user: user.toSafeJSON(),
      token: signToken(user)
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      throw httpError(422, "Email and password are required.");
    }

    const user = await User.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!valid) {
      throw httpError(401, "Email or password is incorrect.");
    }

    res.json({
      user: user.toSafeJSON(),
      token: signToken(user)
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
  })
);

export default router;
