import * as SQLite from 'expo-sqlite';

export type SqliteTodo = {
  id: number;
  text: string;
  done: 0 | 1;
  createdAt: number;
};

const DB_NAME = 'todo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export function getSqliteDbName() {
  return DB_NAME;
}

export async function initSqliteTodos() {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
  `);
}

export async function listTodos(): Promise<SqliteTodo[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<SqliteTodo>(
    'SELECT id, text, done, createdAt FROM todos ORDER BY createdAt DESC;',
  );
  return rows;
}

export async function addTodo(text: string): Promise<number> {
  const database = await getDb();
  const createdAt = Date.now();
  const result = await database.runAsync(
    'INSERT INTO todos (text, done, createdAt) VALUES (?, ?, ?);',
    [text, 0, createdAt],
  );
  return result.lastInsertRowId;
}

export async function updateTodoText(id: number, text: string) {
  const database = await getDb();
  await database.runAsync('UPDATE todos SET text = ? WHERE id = ?;', [text, id]);
}

export async function toggleTodoDone(id: number, nextDone: 0 | 1) {
  const database = await getDb();
  await database.runAsync('UPDATE todos SET done = ? WHERE id = ?;', [nextDone, id]);
}

export async function deleteTodo(id: number) {
  const database = await getDb();
  await database.runAsync('DELETE FROM todos WHERE id = ?;', [id]);
}
