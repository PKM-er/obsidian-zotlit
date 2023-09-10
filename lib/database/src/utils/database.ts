import type { DB } from "@obzt/zotero-type";
import { nonRegularItemTypes } from "@obzt/zotero-type";

const nonRegularItemTypesSQL = nonRegularItemTypes
  .map((v) => `'${v}'`)
  .join(",");

export { nonRegularItemTypesSQL as nonRegularItemTypes };

export const checkID = (col = "itemID") => `--sql
  ${col} IS NOT NULL
  ${
    col === "itemID"
      ? `AND ${col} NOT IN (SELECT itemID FROM deletedItems)`
      : ""
  }
`;

/** not nullable Items.itemID */
export type ItemIDChecked = Exclude<DB.Items["itemID"], null>;

export const whereID = (col: string | boolean, placeholder = "$itemId") =>
  typeof col === "boolean" ? "" : `AND ${col} = ${placeholder}`;

export type IDLibID = [id: number, libId: number];
export type KeyLibID = [key: string, libId: number];
