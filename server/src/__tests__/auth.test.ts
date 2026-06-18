import { describe, it, expect } from "vitest";
import request from "supertest";
import type { AuthResponse, ErrorResponse } from "@kanban/shared";
import { app } from "../app.js";

const validUser = {
  displayName: "Terry",
  email: "terry@example.com",
  password: "password123",
};

describe("POST /api/auth/register", () => {
  it("creates a User and returns a JWT", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    const body: AuthResponse = res.body;
    expect(body.token).toBeDefined();
    expect(body.user.displayName).toBe("Terry");
    expect(body.user.email).toBe("terry@example.com");
    expect(body.user.id).toBeDefined();
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(409);
    const body: ErrorResponse = res.body;
    expect(body.error).toBeDefined();
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "terry@example.com",
    });

    expect(res.status).toBe(400);
  });

  it("rejects password shorter than 8 characters with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...validUser,
      password: "short",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a JWT for valid credentials", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app).post("/api/auth/login").send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.status).toBe(200);
    const body: AuthResponse = res.body;
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(validUser.email);
    expect(body.user.displayName).toBe(validUser.displayName);
  });

  it("rejects wrong password with 401", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app).post("/api/auth/login").send({
      email: validUser.email,
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects non-existent email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});

describe("Auth middleware", () => {
  it("rejects requests without a token with 401", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(401);
  });

  it("accepts requests with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const { token } = registerRes.body as AuthResponse;

    const res = await request(app)
      .get("/api/health")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
