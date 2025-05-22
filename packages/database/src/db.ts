import Client from "better-sqlite3";

interface DatabaseConfig extends Client.Options {
  immutable?: boolean;
}

function initSqliteClient(
  filepath: string,
  { immutable = false, readonly = false, ...options }: DatabaseConfig = {},
): Client.Database {
  if (filepath === ":memory:") {
    return new Client(":memory:", options);
  }
  const params = new URLSearchParams();
  if (immutable) {
    params.set("immutable", "1");
  }
  if (readonly) {
    params.set("mode", "ro");
  }
  return new Client(`file:${filepath}?${params.toString()}`, {
    ...options,
    readonly,
    ...{ uriPath: true }, // option from custom build
  });
}

import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";

import * as ZoteroSchema from "@zt/schema";
import * as BetterBibTeXSchema from "@bbt/schema";

const schemaMap = {
  zt: ZoteroSchema,
  bbt: BetterBibTeXSchema,
} as const;

type DatabaseTarget = keyof typeof schemaMap;

type DatabaseCacheEntry<T extends DatabaseTarget> = {
  path: string;
  instance: DrizzleDatabase<T>;
} | null;

const databaseCache: {
  [K in DatabaseTarget]: DatabaseCacheEntry<K>;
} = {
  zt: null,
  bbt: null,
};

function setDatabaseCache<T extends DatabaseTarget>(
  target: T,
  entry: DatabaseCacheEntry<T>,
): void {
  (databaseCache as Record<T, DatabaseCacheEntry<T>>)[target] = entry;
}
function getDatabaseCache<T extends DatabaseTarget>(
  target: T,
): DatabaseCacheEntry<T> {
  return (databaseCache as Record<T, DatabaseCacheEntry<T>>)[target];
}

type DrizzleDatabase<K extends DatabaseTarget> = BetterSQLite3Database<
  (typeof schemaMap)[K]
> & { $client: Client.Database };

export function init<T extends DatabaseTarget>(
  target: T,
  config: { force?: boolean; filepath: string },
): DrizzleDatabase<T> {
  const cache = getDatabaseCache(target);
  if (cache && cache.path === config.filepath && !config.force) {
    return cache.instance as DrizzleDatabase<T>;
  }
  setDatabaseCache(target, null);
  cache?.instance.$client.close();
  const db = drizzle({
    client: initSqliteClient(config.filepath, {
      immutable: true,
      readonly: true,
      fileMustExist: true,
    }),
    schema: schemaMap[target],
  }) as DrizzleDatabase<T>;

  setDatabaseCache(target, {
    path: config.filepath,
    instance: db,
  });
  return db;
}

export function db<T extends DatabaseTarget>(target: T): DrizzleDatabase<T> {
  const cache = getDatabaseCache(target);
  if (!cache) {
    throw new Error(`Database query before initialization: ${target}`);
  }
  return cache.instance;
}

//   if (e instanceof Client.SqliteError && e.code === "SQLITE_CANTOPEN") {
