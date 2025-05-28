export type DatabaseConnection<TDatabase extends DatabaseWithClient> = {
  filepath: string;
  db: TDatabase;
};

export interface DatabaseWithClient {
  $client: Disposable;
}

export interface BaseDatabaseConfig {
  force?: boolean;
  filepath: string;
}

export abstract class DatabaseManagerBase<
  TDatabase extends DatabaseWithClient,
  TSchema extends Record<string, unknown> = Record<string, never>,
  TConfig extends BaseDatabaseConfig = BaseDatabaseConfig,
> implements Disposable
{
  protected _connection: DatabaseConnection<TDatabase> | null = null;

  /**
   * Initialize or retrieve a database connection for the given schema target
   */
  init(schema: TSchema, config: TConfig): TDatabase {
    const existingConnection = this._connection;

    // Return existing connection if it matches and force is not specified
    if (
      existingConnection &&
      existingConnection.filepath === config.filepath &&
      !config.force
    ) {
      return existingConnection.db;
    }

    // Close existing connection if it exists
    if (existingConnection) {
      existingConnection.db.$client[Symbol.dispose]();
      this._connection = null;
    }

    // Create new database connection using platform-specific implementation
    const db = this.createDatabase(schema, config);

    // Store the new connection
    this._connection = {
      filepath: config.filepath,
      db,
    };

    return db;
  }

  /**
   * Get an existing database connection for the given schema target
   */
  get(): TDatabase {
    const connection = this._connection;
    if (!connection) {
      throw new Error("Database connection not initialized");
    }
    return connection.db;
  }

  /**
   * Close a specific database connection
   */
  [Symbol.dispose](): void {
    const connection = this._connection;
    if (connection) {
      connection.db.$client[Symbol.dispose]();
      this._connection = null;
    }
  }

  /**
   * Check if a connection exists for the given schema target
   */
  hasConnection(): boolean {
    return this._connection !== null;
  }

  /**
   * Platform-specific database creation method to be implemented by subclasses
   */
  protected abstract createDatabase(
    schema: TSchema,
    config: TConfig,
  ): TDatabase;
}
