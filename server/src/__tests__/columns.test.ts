import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse } from "@kanban/shared";
import { app } from "../app.js";

const userA = { displayName: "Alice", email: "alice@example.com", password: "password123" };

async function registerAndGetToken() {
  const res = await request(app).post("/api/auth/register").send(userA);
  return (res.body as AuthResponse).token;
}

async function createBoard(token: string) {
  const res = await request(app)
    .post("/api/boards")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Board" });
  return res.body;
}

async function createColumn(token: string, boardId: string, name: string, color?: string) {
  const res = await request(app)
    .post(`/api/boards/${boardId}/columns`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name, color });
  return res.body;
}

describe("POST /api/boards/:id/columns", () => {
  it("creates a Column with auto-assigned position", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .post(`/api/boards/${board.id}/columns`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "To Do" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("To Do");
    expect(res.body.boardId).toBe(board.id);
    expect(res.body.position).toBeDefined();
    expect(res.body.color).toBeNull();
  });

  it("rejects empty name with 400", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .post(`/api/boards/${board.id}/columns`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });

  it("rejects name over 100 chars with 400", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);

    const res = await request(app)
      .post(`/api/boards/${board.id}/columns`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "a".repeat(101) });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/columns/:id", () => {
  it("updates name and color", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);
    const column = await createColumn(token, board.id, "To Do");

    const res = await request(app)
      .patch(`/api/columns/${column.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Doing", color: "#FF6B6B" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Doing");
    expect(res.body.color).toBe("#FF6B6B");
  });

  it("clears color when set to null", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);
    const column = await createColumn(token, board.id, "To Do", "#FF6B6B");

    const res = await request(app)
      .patch(`/api/columns/${column.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ color: null });

    expect(res.status).toBe(200);
    expect(res.body.color).toBeNull();
  });
});

describe("DELETE /api/columns/:id", () => {
  it("removes the Column", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);
    const column = await createColumn(token, board.id, "To Do");

    const res = await request(app)
      .delete(`/api/columns/${column.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/columns/:id/move", () => {
  it("reorders using float position", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);
    const col1 = await createColumn(token, board.id, "A");
    const col2 = await createColumn(token, board.id, "B");
    const col3 = await createColumn(token, board.id, "C");

    const newPosition = (col1.position + col2.position) / 2;

    const res = await request(app)
      .patch(`/api/columns/${col3.id}/move`)
      .set("Authorization", `Bearer ${token}`)
      .send({ position: newPosition });

    expect(res.status).toBe(200);
    expect(res.body.position).toBe(newPosition);

    const boardRes = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    const names = boardRes.body.columns.map((c: { name: string }) => c.name);
    expect(names).toEqual(["A", "C", "B"]);
  });
});

describe("GET /api/boards/:id (with Columns)", () => {
  it("includes Columns ordered by position", async () => {
    const token = await registerAndGetToken();
    const board = await createBoard(token);
    await createColumn(token, board.id, "To Do");
    await createColumn(token, board.id, "Doing");
    await createColumn(token, board.id, "Done");

    const res = await request(app)
      .get(`/api/boards/${board.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.columns).toHaveLength(3);
    expect(res.body.columns[0].name).toBe("To Do");
    expect(res.body.columns[1].name).toBe("Doing");
    expect(res.body.columns[2].name).toBe("Done");
  });
});
