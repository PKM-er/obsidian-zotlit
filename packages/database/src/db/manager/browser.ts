import { SQLocalDrizzle } from "sqlocal/drizzle";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type { DatabasePath } from "sqlocal";
import { DatabaseManagerBase, type BaseDatabaseConfig } from "./base";

export type BrowserDrizzleDatabase<TSchema extends Record<string, unknown>> =
  SqliteRemoteDatabase<TSchema> & {
    $client: DisposableClient;
  };

export interface BrowserDatabaseConfig extends BaseDatabaseConfig {
  filepath: DatabasePath;
  readonly?: boolean;
  verbose?: boolean;
}

export class DisposableClient extends SQLocalDrizzle {
  [Symbol.dispose](): void {
    this.destroy();
  }
}

export default class BrowserDatabaseManager<
  TSchema extends Record<string, unknown> = Record<string, never>,
> extends DatabaseManagerBase<
  BrowserDrizzleDatabase<TSchema>,
  TSchema,
  BrowserDatabaseConfig
> {
  protected createDatabase(
    schema: TSchema,
    config: BrowserDatabaseConfig,
  ): BrowserDrizzleDatabase<TSchema> {
    // Create new database connection
    const client = new DisposableClient({
      databasePath: config.filepath,
      readOnly: config.readonly,
      verbose: config.verbose,
    });
    const db = drizzle(client.driver, client.batchDriver, {
      schema,
    }) as BrowserDrizzleDatabase<TSchema>;
    db.$client = client;

    return db;
  }
}
