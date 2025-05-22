import Client from "better-sqlite3";

export interface DatabaseConfig extends Client.Options {
  immutable?: boolean;
}

export function initDatabase(
  path: string,
  { immutable, readonly, ...options }: DatabaseConfig = {},
): Database {
  if (path === ":memory:") {
    return new Database(":memory:", options);
  }
  const params = new URLSearchParams();
  if (immutable) {
    params.set("immutable", "1");
  }
  if (readonly) {
    params.set("mode", "ro");
  }
  return new Database(`file:${path}?${params.toString()}`, {
    ...options,
    readonly,
    ...{ uriPath: true }, // option from custom build
  });
}

export class Database extends Client implements Disposable {
  [Symbol.dispose]() {
    this.close();
  }
}
