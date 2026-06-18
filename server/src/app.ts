import express from "express";
import cors from "cors";
import type { HealthResponse } from "@kanban/shared";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { requireAuth } from "./middleware/auth.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);

app.use("/api", requireAuth);

app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => {
  const body: HealthResponse = { status: "ok" };
  res.json(body);
});
