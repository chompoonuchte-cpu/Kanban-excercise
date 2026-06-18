import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthRequest } from "../middleware/auth.js";

export const boardsRouter = Router();

async function canAccessBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return null;
  if (board.ownerId === userId) return board;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return membership ? board : null;
}

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
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(boards);
});

boardsRouter.get("/:id", async (req, res) => {
  const { userId } = req as AuthRequest;
  const access = await canAccessBoard(req.params.id, userId!);

  if (!access) {
    const exists = await prisma.board.findUnique({ where: { id: req.params.id } });
    res.status(exists ? 403 : 404).json({ error: exists ? "Not authorized" : "Board not found" });
    return;
  }

  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              labels: {
                where: { isPrimary: true },
                include: { label: true },
                take: 1,
              },
              assignees: {
                include: { user: { select: { id: true, displayName: true } } },
              },
            },
          },
        },
      },
    },
  });

  const result = {
    ...board,
    columns: board!.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) => {
        const primary = card.labels[0]?.label ?? null;
        const assignees = card.assignees.map((a) => a.user);
        const { labels: _labels, assignees: _assignees, ...cardData } = card;
        return { ...cardData, primaryLabel: primary, assignees };
      }),
    })),
  };

  res.json(result);
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

// --- Members ---

boardsRouter.get("/:id/members", async (req, res) => {
  const { userId } = req as AuthRequest;
  const board = await canAccessBoard(req.params.id, userId!);

  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const memberships = await prisma.boardMember.findMany({
    where: { boardId: board.id },
    include: { user: { select: { id: true, displayName: true, email: true } } },
  });

  const result = [
    {
      userId: board.ownerId,
      boardId: board.id,
      role: "OWNER" as const,
      user: await prisma.user.findUnique({
        where: { id: board.ownerId },
        select: { id: true, displayName: true, email: true },
      }),
    },
    ...memberships.map((m) => ({
      userId: m.userId,
      boardId: m.boardId,
      role: "MEMBER" as const,
      user: m.user,
    })),
  ];

  res.json(result);
});

boardsRouter.post("/:id/members", async (req, res) => {
  const { userId: currentUserId } = req as AuthRequest;
  const board = await canAccessBoard(req.params.id, currentUserId!);

  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (userId === board.ownerId) {
    res.status(409).json({ error: "User is already the Owner" });
    return;
  }

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: board.id, userId } },
  });
  if (existing) {
    res.status(409).json({ error: "User is already a Member" });
    return;
  }

  const member = await prisma.boardMember.create({
    data: { boardId: board.id, userId },
  });

  res.status(201).json(member);
});

boardsRouter.delete("/:id/members/:userId", async (req, res) => {
  const { userId: currentUserId } = req as AuthRequest;
  const board = await canAccessBoard(req.params.id, currentUserId!);

  if (!board) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { userId } = req.params;
  await prisma.boardMember.deleteMany({
    where: { boardId: board.id, userId },
  });

  res.status(204).end();
});
