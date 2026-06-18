import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };
const userB = { displayName: "Bob", email: "bob@example.com", password: "password123" };
const userC = { displayName: "Carol", email: "carol@example.com", password: "password123" };

async function setup() {
  const resA = await request(app).post("/api/auth/register").send(userA);
  const { token: tokenA, user: userAData } = resA.body as AuthResponse;
  const resB = await request(app).post("/api/auth/register").send(userB);
  const { user: userBData } = resB.body as AuthResponse;
  const resC = await request(app).post("/api/auth/register").send(userC);
  const { user: userCData } = resC.body as AuthResponse;

  const board = (await request(app).post("/api/boards").set("Authorization", `Bearer ${tokenA}`).send({ name: "Board" })).body;
  await request(app).post(`/api/boards/${board.id}/members`).set("Authorization", `Bearer ${tokenA}`).send({ userId: userBData.id });
  const column = (await request(app).post(`/api/boards/${board.id}/columns`).set("Authorization", `Bearer ${tokenA}`).send({ name: "To Do" })).body;
  const card = (await request(app).post(`/api/columns/${column.id}/cards`).set("Authorization", `Bearer ${tokenA}`).send({ title: "Task" })).body;
  return { tokenA, board, column, card, userAData, userBData, userCData };
}

describe("POST /api/cards/:id/assignees", () => {
  it("assigns a Board Member to a Card", async () => {
    const { tokenA, card, userBData } = await setup();

    const res = await request(app)
      .post(`/api/cards/${card.id}/assignees`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userBData.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(userBData.id);
    expect(res.body.cardId).toBe(card.id);
  });

  it("rejects non-Board-Member with 403", async () => {
    const { tokenA, card, userCData } = await setup();

    const res = await request(app)
      .post(`/api/cards/${card.id}/assignees`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userCData.id });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/cards/:id/assignees/:userId", () => {
  it("unassigns a Member from a Card", async () => {
    const { tokenA, card, userBData } = await setup();
    await request(app).post(`/api/cards/${card.id}/assignees`).set("Authorization", `Bearer ${tokenA}`).send({ userId: userBData.id });

    const res = await request(app)
      .delete(`/api/cards/${card.id}/assignees/${userBData.id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(204);
  });
});

describe("GET /api/boards/:id (with Assignees and dueDate)", () => {
  it("includes assignees and dueDate in Card data", async () => {
    const { tokenA, board, card, userAData, userBData } = await setup();
    await request(app).post(`/api/cards/${card.id}/assignees`).set("Authorization", `Bearer ${tokenA}`).send({ userId: userAData.id });
    await request(app).post(`/api/cards/${card.id}/assignees`).set("Authorization", `Bearer ${tokenA}`).send({ userId: userBData.id });
    await request(app).patch(`/api/cards/${card.id}`).set("Authorization", `Bearer ${tokenA}`).send({ dueDate: "2026-07-01T17:00:00.000Z" });

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    const cardData = res.body.columns[0].cards[0];
    expect(cardData.assignees).toHaveLength(2);
    expect(cardData.assignees[0].displayName).toBeDefined();
    expect(cardData.dueDate).toBe("2026-07-01T17:00:00.000Z");
  });
});
