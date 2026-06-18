import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };
const userB = { displayName: "Bob", email: "bob@example.com", password: "password123" };

async function registerAndGetToken(user = userA) {
  const res = await request(app).post("/api/auth/register").send(user);
  return res.body as AuthResponse;
}

async function createBoard(token: string, name = "Test Board") {
  const res = await request(app)
    .post("/api/boards")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });
  return res.body;
}

describe("POST /api/boards/:id/members", () => {
  it("adds a registered User as a Member", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const { user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    const res = await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(userBData.id);
    expect(res.body.boardId).toBe(board.id);
  });

  it("rejects duplicate membership with 409", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const { user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    const res = await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    expect(res.status).toBe(409);
  });

  it("rejects non-existent user with 404", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const board = await createBoard(tokenA);

    const res = await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: "00000000-0000-0000-0000-000000000000" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/boards/:id/members", () => {
  it("returns all Members including Owner", async () => {
    const { token: tokenA, user: userAData } = await registerAndGetToken(userA);
    const { user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    const res = await request(app)
      .get(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const owner = res.body.find((m: { userId: string }) => m.userId === userAData.id);
    const member = res.body.find((m: { userId: string }) => m.userId === userBData.id);
    expect(owner.role).toBe("OWNER");
    expect(member.role).toBe("MEMBER");
  });
});

describe("DELETE /api/boards/:id/members/:userId", () => {
  it("removes a Member", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const { user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    const res = await request(app)
      .delete(`/api/boards/${board.id}/members/${userBData.id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listRes.body).toHaveLength(1);
  });
});

describe("GET /api/boards (with membership)", () => {
  it("includes Boards where User is a Member", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const { token: tokenB, user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA, "Alice Board");

    await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    const res = await request(app)
      .get("/api/boards")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alice Board");
  });
});

describe("GET /api/boards/:id (Member access)", () => {
  it("Members can access the Board", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    const { token: tokenB, user: userBData } = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    await request(app)
      .post(`/api/boards/${board.id}/members`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Board");
  });
});

describe("GET /api/users/search", () => {
  it("searches Users by name", async () => {
    const { token: tokenA } = await registerAndGetToken(userA);
    await registerAndGetToken(userB);

    const res = await request(app)
      .get("/api/users/search?q=Bob")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].displayName).toBe("Bob");
    expect(res.body[0].passwordHash).toBeUndefined();
  });
});
