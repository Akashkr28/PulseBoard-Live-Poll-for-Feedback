import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { User } from "../models/User.js";
import {
  clearCsrfCookie,
  clearSessionCookie,
  setSessionCookie
} from "../utils/cookies.js";
import { asyncHandler, httpError } from "../utils/http.js";
import { loginSchema, parseBody, registerSchema } from "../utils/validation.js";

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

router.get("/csrf", issueCsrfToken);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, password, email } = parseBody(registerSchema, req.body);

    const existing = await User.findOne({ email });
    if (existing) {
      throw httpError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    setSessionCookie(res, signToken(user));

    res.status(201).json({
      user: user.toSafeJSON()
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);

    const user = await User.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!valid) {
      throw httpError(401, "Email or password is incorrect.");
    }

    setSessionCookie(res, signToken(user));

    res.json({
      user: user.toSafeJSON()
    });
  })
);

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  clearCsrfCookie(res);
  res.json({ message: "Signed out." });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
  })
);

export default router;
