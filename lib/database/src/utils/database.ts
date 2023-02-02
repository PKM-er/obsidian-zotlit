import type { DB } from "@obzt/zotero-type";
import { nonRegularItemTypes } from "@obzt/zotero-type";

const nonRegularItemTypesSQL = nonRegularItemTypes
  .map((v) => `'${v}'`)
  .join(",");

export { nonRegularItemTypesSQL as nonRegularItemTypes };

export const checkItemID = (col = "itemID") => `--sql
  ${col} IS NOT NULL
  AND ${col} NOT IN (SELECT itemID FROM deletedItems)
`;

/** not nullable Items.itemID */
export type ItemIDChecked = Exclude<DB.Items["itemID"], null>;

export const whereItemID = (col: string | boolean) =>
  typeof col === "boolean" ? "" : `AND ${col} = $itemId`;

export type ItemIDLibID = [id: number, libId: number];
export type ItemKeyLibID = [key: string, libId: number];
