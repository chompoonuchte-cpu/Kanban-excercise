import { describe, it, expect } from "vitest";
import request from "supertest";
import type { HealthResponse } from "@kanban/shared";
import { app } from "../app.js";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    const body: HealthResponse = res.body;
    expect(body.status).toBe("ok");
  });
});
