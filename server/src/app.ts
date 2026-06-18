import express from "express";
import cors from "cors";
import type { HealthResponse } from "@kanban/shared";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const body: HealthResponse = { status: "ok" };
  res.json(body);
});
