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

describe("POST /api/boards/:id/labels", () => {
  it("creates a Label with preset color", async () => {
    const { token, board } = await setup();

    const res = await request(app)
      .post(`/api/boards/${board.id}/labels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Urgent", color: "red" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Urgent");
    expect(res.body.color).toBe("red");
    expect(res.body.boardId).toBe(board.id);
  });
});

describe("PATCH /api/labels/:id", () => {
  it("updates name and color", async () => {
    const { token, board } = await setup();
    const label = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "Urgent", color: "red" })).body;

    const res = await request(app)
      .patch(`/api/labels/${label.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Important", color: "blue" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Important");
    expect(res.body.color).toBe("blue");
  });
});

describe("DELETE /api/labels/:id", () => {
  it("removes Label and cascades from Cards", async () => {
    const { token, board, card } = await setup();
    const label = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "Bug", color: "red" })).body;
    await request(app).post(`/api/cards/${card.id}/labels`).set("Authorization", `Bearer ${token}`).send({ labelId: label.id });

    const res = await request(app)
      .delete(`/api/labels/${label.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const cardRes = await request(app).get(`/api/cards/${card.id}`).set("Authorization", `Bearer ${token}`);
    expect(cardRes.body.labels).toHaveLength(0);
  });
});

describe("POST /api/cards/:id/labels", () => {
  it("attaches a Label to a Card", async () => {
    const { token, board, card } = await setup();
    const label = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "Feature", color: "green" })).body;

    const res = await request(app)
      .post(`/api/cards/${card.id}/labels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ labelId: label.id });

    expect(res.status).toBe(201);
    expect(res.body.labelId).toBe(label.id);
  });
});

describe("DELETE /api/cards/:id/labels/:labelId", () => {
  it("detaches a Label from a Card", async () => {
    const { token, board, card } = await setup();
    const label = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "Feature", color: "green" })).body;
    await request(app).post(`/api/cards/${card.id}/labels`).set("Authorization", `Bearer ${token}`).send({ labelId: label.id });

    const res = await request(app)
      .delete(`/api/cards/${card.id}/labels/${label.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/cards/:id/labels/:labelId/primary", () => {
  it("sets Primary Label and auto-unsets previous", async () => {
    const { token, board, card } = await setup();
    const label1 = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "A", color: "red" })).body;
    const label2 = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "B", color: "blue" })).body;
    await request(app).post(`/api/cards/${card.id}/labels`).set("Authorization", `Bearer ${token}`).send({ labelId: label1.id, isPrimary: true });
    await request(app).post(`/api/cards/${card.id}/labels`).set("Authorization", `Bearer ${token}`).send({ labelId: label2.id });

    const res = await request(app)
      .patch(`/api/cards/${card.id}/labels/${label2.id}/primary`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isPrimary: true });

    expect(res.status).toBe(200);

    const cardRes = await request(app).get(`/api/cards/${card.id}`).set("Authorization", `Bearer ${token}`);
    const primary = cardRes.body.labels.filter((l: { isPrimary: boolean }) => l.isPrimary);
    expect(primary).toHaveLength(1);
    expect(primary[0].labelId).toBe(label2.id);
  });
});

describe("GET /api/boards/:id (with Labels)", () => {
  it("includes Primary Label in Card data", async () => {
    const { token, board, card } = await setup();
    const label = (await request(app).post(`/api/boards/${board.id}/labels`).set("Authorization", `Bearer ${token}`).send({ name: "Project", color: "red" })).body;
    await request(app).post(`/api/cards/${card.id}/labels`).set("Authorization", `Bearer ${token}`).send({ labelId: label.id, isPrimary: true });

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    const cardData = res.body.columns[0].cards[0];
    expect(cardData.primaryLabel).toBeDefined();
    expect(cardData.primaryLabel.name).toBe("Project");
    expect(cardData.primaryLabel.color).toBe("red");
  });
});
