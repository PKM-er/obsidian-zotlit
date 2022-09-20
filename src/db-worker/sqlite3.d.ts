declare module "@aidenlx/better-sqlite3" {
  import Database from "better-sqlite3";
  export default Database;
  export {
    AggregateOptions,
    BackupMetadata,
    BackupOptions,
    ColumnDefinition,
    Database,
    Options,
    PragmaOptions,
    RegistrationOptions,
    RunResult,
    SerializeOptions,
    SqliteError,
    Statement,
    Transaction,
  } from "better-sqlite3";
}
