import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { createModuleLogger } from './logger';

const log = createModuleLogger('Database');

let db: SqlJsDatabase;

function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

function toSqlValue(val: unknown): SqlValue | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val as SqlValue;
  return String(val);
}

function queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params.map(toSqlValue));
  }
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const rows = queryAll(sql, params);
  return rows[0];
}

function execute(sql: string, params: unknown[] = []): void {
  db.run(sql, params.map(toSqlValue));
  saveDb();
}

export async function initializeDatabase(): Promise<void> {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  log.info('Initializing database schema');

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      prefix TEXT DEFAULT '/',
      mod_role_id TEXT,
      admin_role_id TEXT,
      welcome_channel_id TEXT,
      welcome_message TEXT DEFAULT 'Welcome {user} to {server}!',
      log_channel_id TEXT,
      auto_role_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_levels (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_xp_time DATETIME,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS economy (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      last_daily DATETIME,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      subject TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT,
      channel_id TEXT,
      message TEXT NOT NULL,
      remind_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reaction_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS poll_votes (
      poll_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (poll_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS infractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      type TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_user_levels_guild ON user_levels(guild_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_economy_guild ON economy(guild_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(user_id, guild_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(executed, remind_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_infractions_user ON infractions(user_id, guild_id)');

  saveDb();
  log.info('Database schema initialized');
}

export function getGuildConfig(guildId: string): Record<string, unknown> | null {
  const row = queryOne('SELECT * FROM guild_config WHERE guild_id = ?', [guildId]);
  return row ?? null;
}

export function upsertGuildConfig(guildId: string, data: Record<string, unknown>): void {
  const existing = queryOne('SELECT guild_id FROM guild_config WHERE guild_id = ?', [guildId]);

  if (existing) {
    const setClause = Object.keys(data).map((c) => `${c} = ?`).join(', ');
    const values = Object.values(data);
    execute(`UPDATE guild_config SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`, [...values, guildId]);
  } else {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    execute(`INSERT INTO guild_config (guild_id, ${columns.join(', ')}) VALUES (?, ${placeholders})`, [guildId, ...values]);
  }
}

export function addXp(userId: string, guildId: string, amount: number): { newXp: number; newLevel: number; leveledUp: boolean } {
  const row = queryOne('SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?', [userId, guildId]);

  const currentXp = (row?.xp as number) ?? 0;
  const currentLevel = (row?.level as number) ?? 1;
  const newXp = currentXp + amount;
  const xpForNextLevel = currentLevel * 100;
  const leveledUp = newXp >= xpForNextLevel;
  const newLevel = leveledUp ? currentLevel + 1 : currentLevel;

  if (row) {
    execute('UPDATE user_levels SET xp = ?, level = ?, last_xp_time = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?', [newXp, newLevel, userId, guildId]);
  } else {
    execute('INSERT INTO user_levels (user_id, guild_id, xp, level, last_xp_time) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', [userId, guildId, newXp, newLevel]);
  }

  return { newXp, newLevel, leveledUp };
}

export function getLevel(userId: string, guildId: string): { xp: number; level: number } {
  const row = queryOne('SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
  return { xp: (row?.xp as number) ?? 0, level: (row?.level as number) ?? 1 };
}

export function getLeaderboard(guildId: string, limit = 10): Array<{ userId: string; xp: number; level: number }> {
  const rows = queryAll('SELECT user_id, xp, level FROM user_levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?', [guildId, limit]);
  return rows.map((r) => ({
    userId: r.user_id as string,
    xp: r.xp as number,
    level: r.level as number,
  }));
}

export function addWarning(userId: string, guildId: string, moderatorId: string, reason?: string): number {
  execute('INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)', [userId, guildId, moderatorId, reason ?? null]);

  const last = queryOne('SELECT MAX(id) as id FROM warnings');
  return (last?.id as number) ?? 0;
}

export function getWarnings(userId: string, guildId: string): Record<string, unknown>[] {
  return queryAll('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC', [userId, guildId]);
}

export function getPendingReminders(): Array<{ id: number; userId: string; channelId: string; guildId: string | null; message: string }> {
  const rows = queryAll("SELECT id, user_id, channel_id, guild_id, message FROM reminders WHERE executed = 0 AND remind_at <= datetime('now')");
  return rows.map((r) => ({
    id: r.id as number,
    userId: r.user_id as string,
    channelId: r.channel_id as string,
    guildId: (r.guild_id as string | null) ?? null,
    message: r.message as string,
  }));
}

export function markReminderExecuted(id: number): void {
  execute('UPDATE reminders SET executed = 1 WHERE id = ?', [id]);
}

export function getGuildCount(): number {
  const row = queryOne('SELECT COUNT(DISTINCT guild_id) as count FROM guild_config');
  return (row?.count as number) ?? 0;
}

export function close(): void {
  try {
    saveDb();
    db.close();
  } catch {
    // Already closed or failed to close
  }
}

export { db };
