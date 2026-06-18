import { beforeEach, afterAll } from "vitest";
import { prisma } from "../db.js";

beforeEach(async () => {
  await prisma.column.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
