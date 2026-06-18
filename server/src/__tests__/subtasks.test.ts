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
  const card = (await request(app).post(`/api/columns/${column.id}/cards`).set("Authorization", `Bearer ${token}`).send({ title: "Task" })).body;
  return { token, board, column, card };
}

async function createSubtask(token: string, cardId: string, title: string) {
  return (await request(app).post(`/api/cards/${cardId}/subtasks`).set("Authorization", `Bearer ${token}`).send({ title })).body;
}

describe("POST /api/cards/:id/subtasks", () => {
  it("creates a Subtask with auto-assigned position", async () => {
    const { token, card } = await setup();

    const res = await request(app)
      .post(`/api/cards/${card.id}/subtasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Step 1" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Step 1");
    expect(res.body.isDone).toBe(false);
    expect(res.body.position).toBeDefined();
  });

  it("enforces max 20 Subtasks per Card", async () => {
    const { token, card } = await setup();
    for (let i = 0; i < 20; i++) {
      await request(app).post(`/api/cards/${card.id}/subtasks`).set("Authorization", `Bearer ${token}`).send({ title: `Step ${i}` });
    }

    const res = await request(app)
      .post(`/api/cards/${card.id}/subtasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Step 21" });

    expect(res.status).toBe(400);
  });

  it("rejects empty title with 400", async () => {
    const { token, card } = await setup();

    const res = await request(app)
      .post(`/api/cards/${card.id}/subtasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/subtasks/:id", () => {
  it("toggles isDone", async () => {
    const { token, card } = await setup();
    const subtask = await createSubtask(token, card.id, "Step 1");

    const res = await request(app)
      .patch(`/api/subtasks/${subtask.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isDone: true });

    expect(res.status).toBe(200);
    expect(res.body.isDone).toBe(true);
  });

  it("updates title", async () => {
    const { token, card } = await setup();
    const subtask = await createSubtask(token, card.id, "Old");

    const res = await request(app)
      .patch(`/api/subtasks/${subtask.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New");
  });
});

describe("DELETE /api/subtasks/:id", () => {
  it("removes a Subtask", async () => {
    const { token, card } = await setup();
    const subtask = await createSubtask(token, card.id, "Step 1");

    const res = await request(app)
      .delete(`/api/subtasks/${subtask.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/subtasks/:id/move", () => {
  it("reorders with float position", async () => {
    const { token, card } = await setup();
    const s1 = await createSubtask(token, card.id, "A");
    const s2 = await createSubtask(token, card.id, "B");
    const s3 = await createSubtask(token, card.id, "C");

    const newPos = (s1.position + s2.position) / 2;
    await request(app).patch(`/api/subtasks/${s3.id}/move`).set("Authorization", `Bearer ${token}`).send({ position: newPos });

    const cardRes = await request(app).get(`/api/cards/${card.id}`).set("Authorization", `Bearer ${token}`);
    const titles = cardRes.body.subtasks.map((s: { title: string }) => s.title);
    expect(titles).toEqual(["A", "C", "B"]);
  });
});

describe("GET /api/cards/:id (with Subtasks)", () => {
  it("includes Subtasks ordered by position", async () => {
    const { token, card } = await setup();
    await createSubtask(token, card.id, "First");
    await createSubtask(token, card.id, "Second");

    const res = await request(app).get(`/api/cards/${card.id}`).set("Authorization", `Bearer ${token}`);

    expect(res.body.subtasks).toHaveLength(2);
    expect(res.body.subtasks[0].title).toBe("First");
  });
});

describe("GET /api/boards/:id (with Subtask counts)", () => {
  it("includes completed and total counts in Card data", async () => {
    const { token, board, card } = await setup();
    const s1 = await createSubtask(token, card.id, "A");
    await createSubtask(token, card.id, "B");
    await createSubtask(token, card.id, "C");
    await request(app).patch(`/api/subtasks/${s1.id}`).set("Authorization", `Bearer ${token}`).send({ isDone: true });

    const res = await request(app).get(`/api/boards/${board.id}`).set("Authorization", `Bearer ${token}`);

    const cardData = res.body.columns[0].cards[0];
    expect(cardData.subtaskCount).toEqual({ completed: 1, total: 3 });
  });
});
