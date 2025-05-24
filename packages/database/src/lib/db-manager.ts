import Client from "better-sqlite3";

interface DatabaseConfig extends Client.Options {
  immutable?: boolean;
}

import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";

type DatabaseConnection<TSchema extends Record<string, unknown>> = {
  filepath: string;
  instance: DrizzleDatabase<TSchema>;
};

type DrizzleDatabase<TSchema extends Record<string, unknown>> =
  BetterSQLite3Database<TSchema> & { $client: Client.Database };

interface InitializationConfig {
  force?: boolean;
  filepath: string;
  nativeBinding: string | undefined;
}

export default class DatabaseManager<
  TSchema extends Record<string, unknown> = Record<string, never>,
> implements Disposable
{
  #connection: DatabaseConnection<TSchema> | null = null;

  #initClient(
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

  /**
   * Initialize or retrieve a database connection for the given schema target
   */
  init(
    schema: TSchema,
    config: InitializationConfig,
  ): DrizzleDatabase<TSchema> {
    const existingConnection = this.#connection;

    // Return existing connection if it matches and force is not specified
    if (
      existingConnection &&
      existingConnection.filepath === config.filepath &&
      !config.force
    ) {
      return existingConnection.instance;
    }

    // Close existing connection if it exists
    if (existingConnection) {
      existingConnection.instance.$client.close();
      this.#connection = null;
    }

    // Create new database connection
    const db = drizzle({
      client: this.#initClient(config.filepath, {
        immutable: true,
        readonly: true,
        fileMustExist: true,
        nativeBinding: config.nativeBinding,
      }),
      schema,
    });

    // Store the new connection
    this.#connection = {
      filepath: config.filepath,
      instance: db,
    };

    return db;
  }

  /**
   * Get an existing database connection for the given schema target
   */
  get(): DrizzleDatabase<TSchema> {
    const connection = this.#connection;
    if (!connection) {
      throw new Error("Database connection not initialized");
    }
    return connection.instance;
  }

  [Symbol.dispose](): void {
    this.close();
  }

  /**
   * Close a specific database connection
   */
  close(): void {
    const connection = this.#connection;
    if (connection) {
      connection.instance.$client.close();
      this.#connection = null;
    }
  }

  /**
   * Check if a connection exists for the given schema target
   */
  hasConnection(): boolean {
    return this.#connection !== null;
  }
}
