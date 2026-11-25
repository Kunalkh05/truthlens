import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (path: string) => any;
};

let dbInstance: any = null;

export function getDatabase(): any {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath =
    process.env.NODE_ENV === "test" && process.env.TEST_DB === "memory"
      ? ":memory:"
      : path.join(dbDir, "truthlens.db");

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  // Read and run schema migrations
  const schemaPath = path.resolve(process.cwd(), "src/lib/db/schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schemaSql);
  }

  // Seed default admin workspace and user if empty
  const userCount = db.prepare("SELECT count(*) as cnt FROM users").get() as { cnt: number };
  if (userCount.cnt === 0) {
    const now = new Date().toISOString();
    const defaultUserId = "usr_default_admin";
    const defaultWsId = "ws_default_workspace";

    db.prepare(`
      INSERT INTO users (id, auth_subject, created_at, status)
      VALUES (?, ?, ?, ?)
    `).run(defaultUserId, "admin@truthlens.ai", now, "active");

    db.prepare(`
      INSERT INTO workspaces (id, name, created_at, retention_policy_days)
      VALUES (?, ?, ?, ?)
    `).run(defaultWsId, "Default Workspace", now, 30);

    db.prepare(`
      INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
      VALUES (?, ?, ?, ?)
    `).run(defaultWsId, defaultUserId, "admin", now);
  }

  dbInstance = db;
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
