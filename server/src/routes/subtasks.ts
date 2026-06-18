import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const subtasksRouter = Router();

async function canAccessBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return false;
  if (board.ownerId === userId) return true;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return !!membership;
}

subtasksRouter.post("/cards/:cardId/subtasks", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({
    where: { id: req.params.cardId },
    include: { column: { select: { boardId: true } } },
  });
  if (!card) { res.status(404).json({ error: "Card not found" }); return; }
  if (!(await canAccessBoard(card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Subtask title is required" });
    return;
  }
  if (title.length > 100) {
    res.status(400).json({ error: "Subtask title must be 100 characters or less" });
    return;
  }

  const count = await prisma.subtask.count({ where: { cardId: card.id } });
  if (count >= 20) {
    res.status(400).json({ error: "Maximum 20 subtasks per card" });
    return;
  }

  const last = await prisma.subtask.findFirst({ where: { cardId: card.id }, orderBy: { position: "desc" } });
  const position = last ? last.position + 1024 : 1024;

  const subtask = await prisma.subtask.create({
    data: { cardId: card.id, title: title.trim(), position },
  });

  res.status(201).json(subtask);
});

subtasksRouter.patch("/subtasks/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const subtask = await prisma.subtask.findUnique({
    where: { id: req.params.id },
    include: { card: { include: { column: { select: { boardId: true } } } } },
  });
  if (!subtask) { res.status(404).json({ error: "Subtask not found" }); return; }
  if (!(await canAccessBoard(subtask.card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const updates: Record<string, unknown> = {};
  if ("title" in req.body) {
    if (!req.body.title || req.body.title.trim().length === 0) { res.status(400).json({ error: "Subtask title is required" }); return; }
    if (req.body.title.length > 100) { res.status(400).json({ error: "Subtask title must be 100 characters or less" }); return; }
    updates.title = req.body.title.trim();
  }
  if ("isDone" in req.body) updates.isDone = req.body.isDone;

  const updated = await prisma.subtask.update({ where: { id: subtask.id }, data: updates });
  res.json(updated);
});

subtasksRouter.delete("/subtasks/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const subtask = await prisma.subtask.findUnique({
    where: { id: req.params.id },
    include: { card: { include: { column: { select: { boardId: true } } } } },
  });
  if (!subtask) { res.status(404).json({ error: "Subtask not found" }); return; }
  if (!(await canAccessBoard(subtask.card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  await prisma.subtask.delete({ where: { id: subtask.id } });
  res.status(204).end();
});

subtasksRouter.patch("/subtasks/:id/move", async (req, res) => {
  const { userId } = req as AuthRequest;
  const subtask = await prisma.subtask.findUnique({
    where: { id: req.params.id },
    include: { card: { include: { column: { select: { boardId: true } } } } },
  });
  if (!subtask) { res.status(404).json({ error: "Subtask not found" }); return; }
  if (!(await canAccessBoard(subtask.card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const { position } = req.body;
  if (typeof position !== "number") { res.status(400).json({ error: "position is required" }); return; }

  const updated = await prisma.subtask.update({ where: { id: subtask.id }, data: { position } });
  res.json(updated);
});
