import "dotenv/config";
import { createPool } from "./pool.js";

const pool = createPool();

/**
 * Migration بسيطة (بدون أدوات خارجية) عشان المشروع يبقى سهل.
 */
const sql = `
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
`;

async function main() {
  try {
    await pool.query(sql);
    console.log("✅ Migration complete (todos table ready).");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
