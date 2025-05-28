import Client from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { DatabaseManagerBase, type BaseDatabaseConfig } from "./base";

export type NodeDrizzleDatabase<TSchema extends Record<string, unknown>> =
  BetterSQLite3Database<TSchema> & {
    $client: DisposableClient;
  };

export interface NodeDatabaseConfig extends BaseDatabaseConfig {
  nativeBinding: string | undefined;
  immutable?: boolean;
  readonly?: boolean;
  fileMustExist?: boolean;
}

class DisposableClient extends Client {
  [Symbol.dispose](): void {
    this.close();
  }
}

export default class NodeDatabaseManager<
  TSchema extends Record<string, unknown> = Record<string, never>,
> extends DatabaseManagerBase<
  NodeDrizzleDatabase<TSchema>,
  TSchema,
  NodeDatabaseConfig
> {
  #initClient({
    filepath,
    immutable = false,
    readonly = false,
    nativeBinding,
  }: NodeDatabaseConfig) {
    if (filepath === ":memory:") {
      return new DisposableClient(":memory:", { readonly, nativeBinding });
    }
    const params = new URLSearchParams();
    if (immutable) {
      params.set("immutable", "1");
    }
    if (readonly) {
      params.set("mode", "ro");
    }
    return new DisposableClient(`file:${filepath}?${params.toString()}`, {
      nativeBinding,
      readonly,
      ...{ uriPath: true }, // option from custom build
    });
  }

  protected createDatabase(
    schema: TSchema,
    config: NodeDatabaseConfig,
  ): NodeDrizzleDatabase<TSchema> {
    const client = this.#initClient(config);
    return drizzle({
      client,
      schema,
      logger: process.env.NODE_ENV === "development",
    }) as NodeDrizzleDatabase<TSchema>;
  }
}
