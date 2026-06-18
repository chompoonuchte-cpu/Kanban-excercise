import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse, HealthResponse } from "@kanban/shared";
import { app } from "../app.js";

describe("GET /api/health", () => {
  it("returns 200 with status ok when authenticated", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      displayName: "Test",
      email: "test@example.com",
      password: "password123",
    });
    const { token } = registerRes.body as AuthResponse;

    const res = await request(app)
      .get("/api/health")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body: HealthResponse = res.body;
    expect(body.status).toBe("ok");
  });
});
