import express from "express";
import cors from "cors";
import type { HealthResponse } from "@kanban/shared";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { boardsRouter } from "./routes/boards.js";
import { columnsRouter } from "./routes/columns.js";
import { cardsRouter } from "./routes/cards.js";
import { labelsRouter } from "./routes/labels.js";
import { requireAuth } from "./middleware/auth.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);

app.use("/api", requireAuth);

app.use("/api/users", usersRouter);
app.use("/api/boards", boardsRouter);
app.use("/api", columnsRouter);
app.use("/api", cardsRouter);
app.use("/api", labelsRouter);

app.get("/api/health", (_req, res) => {
  const body: HealthResponse = { status: "ok" };
  res.json(body);
});
