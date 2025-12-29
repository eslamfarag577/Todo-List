import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPool } from "./db/pool.js";
import { createTodoSchema, updateTodoSchema } from "./validation/todo.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const pool = createPool();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, db: r.rows[0]?.ok === 1 });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

app.get("/api/todos", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY created_at DESC"
  );
  res.json(rows);
});

app.post("/api/todos", async (req, res) => {
  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title } = parsed.data;
  const { rows } = await pool.query(
    "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, created_at, updated_at",
    [title]
  );
  res.status(201).json(rows[0]);
});

app.patch("/api/todos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateTodoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, completed } = parsed.data;

  const fields = [];
  const values = [];
  let i = 1;

  if (typeof title === "string") { fields.push(`title = $${i++}`); values.push(title); }
  if (typeof completed === "boolean") { fields.push(`completed = $${i++}`); values.push(completed); }

  fields.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE todos
    SET ${fields.join(", ")}
    WHERE id = $${i}
    RETURNING id, title, completed, created_at, updated_at
  `;

  const { rows } = await pool.query(sql, values);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

app.delete("/api/todos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [id]);
  if (rowCount === 0) return res.status(404).json({ error: "Not found" });

  res.status(204).send();
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`✅ API listening on http://localhost:${port}`);
  console.log(`✅ Try: http://localhost:${port}/api/health`);
});
