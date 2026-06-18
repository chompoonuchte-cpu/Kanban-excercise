import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";
import { LABEL_COLORS } from "@kanban/shared";

export const labelsRouter = Router();

async function canAccessBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return false;
  if (board.ownerId === userId) return true;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return !!membership;
}

labelsRouter.get("/boards/:boardId/labels", async (req, res) => {
  const { userId } = req as AuthRequest;
  if (!(await canAccessBoard(req.params.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const labels = await prisma.label.findMany({ where: { boardId: req.params.boardId }, orderBy: { createdAt: "asc" } });
  res.json(labels);
});

labelsRouter.post("/boards/:boardId/labels", async (req, res) => {
  const { userId } = req as AuthRequest;
  if (!(await canAccessBoard(req.params.boardId, userId!))) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { name, color } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Label name is required" });
    return;
  }
  if (!LABEL_COLORS.includes(color)) {
    res.status(400).json({ error: "Invalid label color" });
    return;
  }

  const label = await prisma.label.create({
    data: { boardId: req.params.boardId, name: name.trim(), color },
  });

  res.status(201).json(label);
});

labelsRouter.patch("/labels/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const label = await prisma.label.findUnique({ where: { id: req.params.id } });
  if (!label) { res.status(404).json({ error: "Label not found" }); return; }
  if (!(await canAccessBoard(label.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const updates: Record<string, string> = {};
  if (req.body.name !== undefined) updates.name = req.body.name.trim();
  if (req.body.color !== undefined) {
    if (!LABEL_COLORS.includes(req.body.color)) { res.status(400).json({ error: "Invalid label color" }); return; }
    updates.color = req.body.color;
  }

  const updated = await prisma.label.update({ where: { id: label.id }, data: updates });
  res.json(updated);
});

labelsRouter.delete("/labels/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const label = await prisma.label.findUnique({ where: { id: req.params.id } });
  if (!label) { res.status(404).json({ error: "Label not found" }); return; }
  if (!(await canAccessBoard(label.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  await prisma.label.delete({ where: { id: label.id } });
  res.status(204).end();
});

// Card-Label operations

labelsRouter.post("/cards/:cardId/labels", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId }, include: { column: { select: { boardId: true } } } });
  if (!card) { res.status(404).json({ error: "Card not found" }); return; }
  if (!(await canAccessBoard(card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const { labelId, isPrimary } = req.body;

  if (isPrimary) {
    await prisma.cardLabel.updateMany({ where: { cardId: card.id, isPrimary: true }, data: { isPrimary: false } });
  }

  const cardLabel = await prisma.cardLabel.create({
    data: { cardId: card.id, labelId, isPrimary: isPrimary ?? false },
  });

  res.status(201).json(cardLabel);
});

labelsRouter.delete("/cards/:cardId/labels/:labelId", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId }, include: { column: { select: { boardId: true } } } });
  if (!card) { res.status(404).json({ error: "Card not found" }); return; }
  if (!(await canAccessBoard(card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  await prisma.cardLabel.deleteMany({ where: { cardId: card.id, labelId: req.params.labelId } });
  res.status(204).end();
});

labelsRouter.patch("/cards/:cardId/labels/:labelId/primary", async (req, res) => {
  const { userId } = req as AuthRequest;
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId }, include: { column: { select: { boardId: true } } } });
  if (!card) { res.status(404).json({ error: "Card not found" }); return; }
  if (!(await canAccessBoard(card.column.boardId, userId!))) { res.status(403).json({ error: "Not authorized" }); return; }

  const { isPrimary } = req.body;

  if (isPrimary) {
    await prisma.cardLabel.updateMany({ where: { cardId: card.id, isPrimary: true }, data: { isPrimary: false } });
  }

  const updated = await prisma.cardLabel.update({
    where: { cardId_labelId: { cardId: card.id, labelId: req.params.labelId } },
    data: { isPrimary: isPrimary ?? false },
  });

  res.json(updated);
});
