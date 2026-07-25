import * as SQLite from 'expo-sqlite';

/**
 * Chapter 17 — Offline Guard Queue.
 *
 * `expo-sqlite` rather than AsyncStorage: the queue needs structured
 * querying (pending vs. synced, ordered replay), not a single blob. Scoped
 * to the four gate-side writes a guard performs continuously through a
 * shift — see useOfflineMutation.ts for which endpoints opt in. Reads
 * (visitor queue, resident search) are never queued here, they just fall
 * back to cached TanStack Query data plus an offline banner.
 */

export type OfflineAction = {
  id: number;
  endpoint: string;
  method: string;
  payload: string; // JSON-encoded request body
  createdAt: string;
  synced: boolean;
};

const DB_NAME = 'portl-offline-queue.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS offline_actions (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           endpoint TEXT NOT NULL,
           method TEXT NOT NULL,
           payload TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT (datetime('now')),
           synced INTEGER NOT NULL DEFAULT 0
         );`
      );
      return db;
    });
  }
  return dbPromise;
}

function rowToAction(row: {
  id: number;
  endpoint: string;
  method: string;
  payload: string;
  created_at: string;
  synced: number;
}): OfflineAction {
  return {
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    payload: row.payload,
    createdAt: row.created_at,
    synced: row.synced === 1
  };
}

/** Insert a queued write. Called by useOfflineMutation on a network-layer failure. */
export async function enqueueOfflineAction(
  endpoint: string,
  method: string,
  payload: unknown
): Promise<OfflineAction> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO offline_actions (endpoint, method, payload) VALUES (?, ?, ?)',
    [endpoint, method, JSON.stringify(payload ?? null)]
  );
  const row = await db.getFirstAsync<{
    id: number;
    endpoint: string;
    method: string;
    payload: string;
    created_at: string;
    synced: number;
  }>('SELECT * FROM offline_actions WHERE id = ?', [result.lastInsertRowId]);
  if (!row) {
    throw new Error('Failed to read back queued offline action');
  }
  return rowToAction(row);
}

/** All rows that haven't synced yet, oldest first — the order useOfflineSync replays in. */
export async function listPendingOfflineActions(): Promise<OfflineAction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    endpoint: string;
    method: string;
    payload: string;
    created_at: string;
    synced: number;
  }>('SELECT * FROM offline_actions WHERE synced = 0 ORDER BY created_at ASC, id ASC');
  return rows.map(rowToAction);
}

/** Count of unsynced rows — backs the "N pending sync" badge in the guard UI. */
export async function countPendingOfflineActions(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM offline_actions WHERE synced = 0'
  );
  return row?.count ?? 0;
}

export async function markOfflineActionSynced(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE offline_actions SET synced = 1 WHERE id = ?', [id]);
}

/** Best-effort cleanup — call occasionally so the table doesn't grow unbounded. */
export async function clearSyncedOfflineActions(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM offline_actions WHERE synced = 1');
}
