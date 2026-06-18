import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse, AuthUser } from "@kanban/shared";
import { app } from "../app.js";

const validUser = {
  displayName: "Terry",
  email: "terry@example.com",
  password: "password123",
};

async function registerAndGetToken() {
  const res = await request(app).post("/api/auth/register").send(validUser);
  return (res.body as AuthResponse).token;
}

describe("GET /api/users/me", () => {
  it("returns the authenticated User's profile", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body: AuthUser = res.body;
    expect(body.displayName).toBe("Terry");
    expect(body.email).toBe("terry@example.com");
    expect(body.id).toBeDefined();
  });
});

describe("PATCH /api/users/me", () => {
  it("updates displayName and email", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "New Name", email: "new@example.com" });

    expect(res.status).toBe(200);
    const body: AuthUser = res.body;
    expect(body.displayName).toBe("New Name");
    expect(body.email).toBe("new@example.com");
  });

  it("changes password with correct currentPassword", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password123", newPassword: "newpassword123" });

    expect(res.status).toBe(200);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: validUser.email,
      password: "newpassword123",
    });
    expect(loginRes.status).toBe(200);
  });

  it("rejects wrong currentPassword with 401", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpassword123" });

    expect(res.status).toBe(401);
  });

  it("rejects new password shorter than 8 chars with 400", async () => {
    const token = await registerAndGetToken();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password123", newPassword: "short" });

    expect(res.status).toBe(400);
  });

  it("rejects duplicate email with 409", async () => {
    const token = await registerAndGetToken();
    await request(app).post("/api/auth/register").send({
      displayName: "Other",
      email: "other@example.com",
      password: "password123",
    });

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "other@example.com" });

    expect(res.status).toBe(409);
  });
});
