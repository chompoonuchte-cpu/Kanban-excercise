import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };

async function setup() {
  const res = await request(app).post("/api/auth/register").send(userA);
  const { token } = res.body as AuthResponse;
  const board = (await request(app).post("/api/boards").set("Authorization", `Bearer ${token}`).send({ name: "Board" })).body;
  const colA = (await request(app).post(`/api/boards/${board.id}/columns`).set("Authorization", `Bearer ${token}`).send({ name: "To Do" })).body;
  const colB = (await request(app).post(`/api/boards/${board.id}/columns`).set("Authorization", `Bearer ${token}`).send({ name: "Doing" })).body;
  const card1 = (await request(app).post(`/api/columns/${colA.id}/cards`).set("Authorization", `Bearer ${token}`).send({ title: "Task 1" })).body;
  const card2 = (await request(app).post(`/api/columns/${colA.id}/cards`).set("Authorization", `Bearer ${token}`).send({ title: "Task 2" })).body;
  const card3 = (await request(app).post(`/api/columns/${colA.id}/cards`).set("Authorization", `Bearer ${token}`).send({ title: "Task 3" })).body;
  return { token, board, colA, colB, card1, card2, card3 };
}

describe("PATCH /api/cards/:id/move", () => {
  it("moves a Card to a different Column", async () => {
    const { token, board, colA, colB, card1 } = await setup();

    const res = await request(app)
      .patch(`/api/cards/${card1.id}/move`)
      .set("Authorization", `Bearer ${token}`)
      .send({ columnId: colB.id, position: 1024 });

    expect(res.status).toBe(200);
    expect(res.body.columnId).toBe(colB.id);
    expect(res.body.position).toBe(1024);

    const boardRes = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    const todoCards = boardRes.body.columns.find((c: { id: string }) => c.id === colA.id).cards;
    const doingCards = boardRes.body.columns.find((c: { id: string }) => c.id === colB.id).cards;
    expect(todoCards).toHaveLength(2);
    expect(doingCards).toHaveLength(1);
    expect(doingCards[0].title).toBe("Task 1");
  });

  it("reorders a Card within the same Column", async () => {
    const { token, board, colA, card1, card2, card3 } = await setup();

    const newPosition = (card1.position + card2.position) / 2;
    const res = await request(app)
      .patch(`/api/cards/${card3.id}/move`)
      .set("Authorization", `Bearer ${token}`)
      .send({ columnId: colA.id, position: newPosition });

    expect(res.status).toBe(200);

    const boardRes = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    const cards = boardRes.body.columns.find((c: { id: string }) => c.id === colA.id).cards;
    const titles = cards.map((c: { title: string }) => c.title);
    expect(titles).toEqual(["Task 1", "Task 3", "Task 2"]);
  });
});
