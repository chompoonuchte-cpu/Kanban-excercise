import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/me", async (req, res) => {
  const { userId } = req as AuthRequest;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, displayName: user.displayName, email: user.email });
});

usersRouter.patch("/me", async (req, res) => {
  const { userId } = req as AuthRequest;
  const { displayName, email, currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Record<string, string> = {};

  if (displayName !== undefined) {
    if (!displayName || displayName.length > 100) {
      res.status(400).json({ error: "Display name is required and max 100 characters" });
      return;
    }
    updates.displayName = displayName;
  }

  if (email !== undefined) {
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    updates.email = email;
  }

  if (newPassword !== undefined) {
    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  res.json({ id: updated.id, displayName: updated.displayName, email: updated.email });
});
