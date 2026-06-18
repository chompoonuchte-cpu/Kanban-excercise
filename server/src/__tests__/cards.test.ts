import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };

async function setup() {
  const res = await request(app).post("/api/auth/register").send(userA);
  const { token } = res.body as AuthResponse;
  const board = (await request(app).post("/api/boards").set("Authorization", `Bearer ${token}`).send({ name: "Board" })).body;
  const column = (await request(app).post(`/api/boards/${board.id}/columns`).set("Authorization", `Bearer ${token}`).send({ name: "To Do" })).body;
  return { token, board, column };
}

async function createCard(token: string, columnId: string, title: string) {
  const res = await request(app)
    .post(`/api/columns/${columnId}/cards`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title });
  return res;
}

describe("POST /api/columns/:id/cards", () => {
  it("creates a Card with auto-assigned position", async () => {
    const { token, column } = await setup();

    const res = await createCard(token, column.id, "My Task");

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("My Task");
    expect(res.body.columnId).toBe(column.id);
    expect(res.body.position).toBeDefined();
    expect(res.body.description).toBeNull();
  });

  it("rejects empty title with 400", async () => {
    const { token, column } = await setup();

    const res = await createCard(token, column.id, "");
    expect(res.status).toBe(400);
  });

  it("rejects title over 255 chars with 400", async () => {
    const { token, column } = await setup();

    const res = await createCard(token, column.id, "a".repeat(256));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/cards/:id", () => {
  it("returns full Card detail", async () => {
    const { token, column } = await setup();
    const card = (await createCard(token, column.id, "My Task")).body;

    const res = await request(app)
      .get(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("My Task");
    expect(res.body.id).toBe(card.id);
  });
});

describe("PATCH /api/cards/:id", () => {
  it("updates title, description, and dueDate", async () => {
    const { token, column } = await setup();
    const card = (await createCard(token, column.id, "Old Title")).body;

    const dueDate = "2026-07-01T17:00:00.000Z";
    const res = await request(app)
      .patch(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Title", description: "Some details", dueDate });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New Title");
    expect(res.body.description).toBe("Some details");
    expect(res.body.dueDate).toBe(dueDate);
  });
});

describe("DELETE /api/cards/:id", () => {
  it("removes the Card", async () => {
    const { token, column } = await setup();
    const card = (await createCard(token, column.id, "To Delete")).body;

    const res = await request(app)
      .delete(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});

describe("GET /api/boards/:id (with Cards)", () => {
  it("includes Cards within Columns ordered by position", async () => {
    const { token, board, column } = await setup();
    await createCard(token, column.id, "First");
    await createCard(token, column.id, "Second");

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const col = res.body.columns[0];
    expect(col.cards).toHaveLength(2);
    expect(col.cards[0].title).toBe("First");
    expect(col.cards[1].title).toBe("Second");
  });
});
