import type { Knex } from "@knex";

declare module "@aidenlx/knex/types/tables" {
  export interface CiteKeys {
    itemID: number;
    libraryID: number;
    itemKey: string;
    citekey: string;
  }
  interface Tables {
    citekeys: CiteKeys;
  }
}
const sql = (knex: Knex) => knex.select("itemID", "citekey").from("citekeys");
export default sql;
