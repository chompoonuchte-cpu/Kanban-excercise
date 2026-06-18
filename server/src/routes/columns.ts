import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const columnsRouter = Router();

async function canAccessBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return null;
  if (board.ownerId === userId) return board;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return membership ? board : null;
}

// Nested under /api/boards/:boardId/columns
columnsRouter.post("/boards/:boardId/columns", async (req, res) => {
  const { userId } = req as AuthRequest;
  const board = await canAccessBoard(req.params.boardId, userId!);
  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { name, color } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Column name is required" });
    return;
  }
  if (name.length > 100) {
    res.status(400).json({ error: "Column name must be 100 characters or less" });
    return;
  }

  const lastColumn = await prisma.column.findFirst({
    where: { boardId: board.id },
    orderBy: { position: "desc" },
  });
  const position = lastColumn ? lastColumn.position + 1024 : 1024;

  const column = await prisma.column.create({
    data: {
      boardId: board.id,
      name: name.trim(),
      color: color ?? null,
      position,
    },
  });

  res.status(201).json(column);
});

// Flat routes under /api/columns/:id
columnsRouter.patch("/columns/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const column = await prisma.column.findUnique({ where: { id: req.params.id } });
  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }

  const board = await canAccessBoard(column.boardId, userId!);
  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updates: Record<string, unknown> = {};

  if (req.body.name !== undefined) {
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Column name is required" });
      return;
    }
    if (name.length > 100) {
      res.status(400).json({ error: "Column name must be 100 characters or less" });
      return;
    }
    updates.name = name.trim();
  }

  if ("color" in req.body) {
    updates.color = req.body.color ?? null;
  }

  const updated = await prisma.column.update({
    where: { id: column.id },
    data: updates,
  });

  res.json(updated);
});

columnsRouter.delete("/columns/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const column = await prisma.column.findUnique({ where: { id: req.params.id } });
  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }

  const board = await canAccessBoard(column.boardId, userId!);
  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.column.delete({ where: { id: column.id } });
  res.status(204).end();
});

columnsRouter.patch("/columns/:id/move", async (req, res) => {
  const { userId } = req as AuthRequest;
  const column = await prisma.column.findUnique({ where: { id: req.params.id } });
  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }

  const board = await canAccessBoard(column.boardId, userId!);
  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { position } = req.body;
  if (typeof position !== "number") {
    res.status(400).json({ error: "position is required" });
    return;
  }

  const updated = await prisma.column.update({
    where: { id: column.id },
    data: { position },
  });

  res.json(updated);
});
