import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

function sendValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed", errors: errors.array() });
    return true;
  }

  return false;
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["student", "admin"])
  ],
  async (req, res, next) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const existing = await User.findOne({ email: req.body.email });
      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        rollNumber: req.body.rollNumber,
        password: req.body.password,
        role: req.body.role || "student"
      });

      res.status(201).json({ user: user.toSafeObject(), token: signToken(user) });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    try {
      if (sendValidationErrors(req, res)) return;

      const user = await User.findOne({ email: req.body.email });
      if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ user: user.toSafeObject(), token: signToken(user) });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

export default router;
