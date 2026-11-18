/**
 * SQLite Database Connector using Node.js v24 Native DatabaseSync
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema.js';

// Cache of compiled prepared statements keyed by database instance
const statementCache = new WeakMap();

/**
 * Creates or connects to a SQLite database instance using native Node.js DatabaseSync.
 * Configures high-throughput PRAGMAs (WAL mode, memory temp store, 64MB cache).
 *
 * @param {string|object} [dbPathOrOptions=':memory:'] Path to SQLite DB file or options object
 * @returns {DatabaseSync}
 */
export function getDatabase(dbPathOrOptions = ':memory:') {
  let dbPath = ':memory:';

  if (typeof dbPathOrOptions === 'string') {
    dbPath = dbPathOrOptions;
  } else if (dbPathOrOptions && typeof dbPathOrOptions === 'object') {
    dbPath = dbPathOrOptions.path ?? dbPathOrOptions.dbPath ?? ':memory:';
  }

  const db = new DatabaseSync(dbPath);

  // Performance & Integrity PRAGMAs
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA temp_store = MEMORY;');
  db.exec('PRAGMA cache_size = -64000;');

  if (dbPath !== ':memory:') {
    try {
      db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // Memory or restricted DB environments fallback cleanly
    }
  }

  return db;
}

/**
 * Executes the DDL schema on the provided SQLite DatabaseSync instance
 *
 * @param {DatabaseSync} db DatabaseSync instance
 * @param {string} [ddl=SCHEMA_SQL] Optional custom DDL SQL script
 * @returns {DatabaseSync} The initialized database instance
 */
export function initSchema(db, ddl = SCHEMA_SQL) {
  if (!db || typeof db.exec !== 'function') {
    throw new TypeError('Valid DatabaseSync instance with an exec() method is required');
  }

  db.exec(ddl);
  return db;
}

/**
 * Retrieves a cached prepared statement for a database instance,
 * avoiding redundant SQL parsing overhead for high-frequency operations.
 *
 * @param {DatabaseSync} db DatabaseSync instance
 * @param {string} sql SQL statement to prepare and cache
 * @returns {object} Prepared StatementSync instance
 */
export function prepareCached(db, sql) {
  if (!db || typeof db.prepare !== 'function') {
    throw new TypeError('Valid DatabaseSync instance with a prepare() method is required');
  }

  let dbCache = statementCache.get(db);
  if (!dbCache) {
    dbCache = new Map();
    statementCache.set(db, dbCache);
  }

  let stmt = dbCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    dbCache.set(sql, stmt);
  }

  return stmt;
}

/**
 * Alias for initSchema for PROJECT.md contract compatibility
 */
export const runSchema = initSchema;
