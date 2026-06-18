import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import type { AuthResponse, RegisterBody, LoginBody } from "@kanban/shared";

export const authRouter = Router();

const JWT_SECRET = process.env["JWT_SECRET"] ?? "dev-secret";
const JWT_EXPIRES_IN = "7d";

authRouter.post("/register", async (req, res) => {
  const { displayName, email, password } = req.body as RegisterBody;

  if (!displayName || !email || !password) {
    res.status(400).json({ error: "displayName, email, and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { displayName, email, passwordHash },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const body: AuthResponse = {
    token,
    user: { id: user.id, displayName: user.displayName, email: user.email },
  };
  res.status(201).json(body);
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const body: AuthResponse = {
    token,
    user: { id: user.id, displayName: user.displayName, email: user.email },
  };
  res.json(body);
});
