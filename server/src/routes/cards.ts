import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const cardsRouter = Router();

async function canAccessBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return false;
  if (board.ownerId === userId) return true;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return !!membership;
}

cardsRouter.post("/columns/:columnId/cards", async (req, res) => {
  const { userId } = req as AuthRequest;
  const column = await prisma.column.findUnique({ where: { id: req.params.columnId } });
  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }

  if (!(await canAccessBoard(column.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Card title is required" });
    return;
  }
  if (title.length > 255) {
    res.status(400).json({ error: "Card title must be 255 characters or less" });
    return;
  }

  const lastCard = await prisma.card.findFirst({
    where: { columnId: column.id },
    orderBy: { position: "desc" },
  });
  const position = lastCard ? lastCard.position + 1024 : 1024;

  const card = await prisma.card.create({
    data: { columnId: column.id, title: title.trim(), position },
  });

  res.status(201).json(card);
});

cardsRouter.get("/cards/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: { column: { select: { boardId: true } } },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  if (!(await canAccessBoard(card.column.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { column: _column, ...cardData } = card;
  res.json(cardData);
});

cardsRouter.patch("/cards/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: { column: { select: { boardId: true } } },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  if (!(await canAccessBoard(card.column.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updates: Record<string, unknown> = {};

  if (req.body.title !== undefined) {
    const { title } = req.body;
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Card title is required" });
      return;
    }
    if (title.length > 255) {
      res.status(400).json({ error: "Card title must be 255 characters or less" });
      return;
    }
    updates.title = title.trim();
  }

  if ("description" in req.body) {
    const desc = req.body.description;
    if (desc !== null && typeof desc === "string" && desc.length > 5000) {
      res.status(400).json({ error: "Description must be 5000 characters or less" });
      return;
    }
    updates.description = desc ?? null;
  }

  if ("dueDate" in req.body) {
    updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  }

  if ("columnId" in req.body) {
    updates.columnId = req.body.columnId;
  }

  if ("position" in req.body) {
    updates.position = req.body.position;
  }

  const updated = await prisma.card.update({
    where: { id: card.id },
    data: updates,
  });

  res.json(updated);
});

cardsRouter.delete("/cards/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: { column: { select: { boardId: true } } },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  if (!(await canAccessBoard(card.column.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.card.delete({ where: { id: card.id } });
  res.status(204).end();
});
