import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const boardsRouter = Router();

boardsRouter.post("/", async (req, res) => {
  const { userId } = req as AuthRequest;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Board name is required" });
    return;
  }
  if (name.length > 100) {
    res.status(400).json({ error: "Board name must be 100 characters or less" });
    return;
  }

  const board = await prisma.board.create({
    data: { name: name.trim(), ownerId: userId! },
  });

  res.status(201).json(board);
});

boardsRouter.get("/", async (req, res) => {
  const { userId } = req as AuthRequest;

  const boards = await prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  res.json(boards);
});

boardsRouter.get("/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const board = await prisma.board.findUnique({ where: { id: req.params.id } });

  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  if (board.ownerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  res.json(board);
});

boardsRouter.patch("/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const board = await prisma.board.findUnique({ where: { id: req.params.id } });

  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  if (board.ownerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Board name is required" });
    return;
  }
  if (name.length > 100) {
    res.status(400).json({ error: "Board name must be 100 characters or less" });
    return;
  }

  const updated = await prisma.board.update({
    where: { id: board.id },
    data: { name: name.trim() },
  });

  res.json(updated);
});

boardsRouter.delete("/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const board = await prisma.board.findUnique({ where: { id: req.params.id } });

  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  if (board.ownerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.board.delete({ where: { id: board.id } });
  res.status(204).end();
});
