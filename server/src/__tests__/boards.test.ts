import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };
const userB = { displayName: "Bob", email: "bob@example.com", password: "password123" };

async function registerAndGetToken(user = userA) {
  const res = await request(app).post("/api/auth/register").send(user);
  return (res.body as AuthResponse).token;
}

async function createBoard(token: string, name = "My Board") {
  const res = await request(app)
    .post("/api/boards")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });
  return res.body;
}

describe("POST /api/boards", () => {
  it("creates a Board and sets creator as Owner", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Board" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Board");
    expect(res.body.id).toBeDefined();
    expect(res.body.ownerId).toBeDefined();
  });

  it("rejects empty name with 400", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });

  it("rejects name over 100 chars with 400", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "a".repeat(101) });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/boards", () => {
  it("returns only current User's Boards", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    await createBoard(tokenA, "Alice Board");
    await createBoard(tokenB, "Bob Board");

    const res = await request(app)
      .get("/api/boards")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alice Board");
  });
});

describe("GET /api/boards/:id", () => {
  it("returns Board detail for Owner", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("My Board");
  });
});

describe("PATCH /api/boards/:id", () => {
  it("Owner can rename a Board", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .patch(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
  });

  it("non-Owner gets 403", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    const res = await request(app)
      .patch(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/boards/:id", () => {
  it("Owner can delete a Board", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .delete(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it("non-Owner gets 403", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);
    const board = await createBoard(tokenA);

    const res = await request(app)
      .delete(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });
});
