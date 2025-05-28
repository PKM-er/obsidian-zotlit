import * as Schema from "@zt/schema";
import * as Relations from "@zt/relations";

export const schema = { ...Schema, ...Relations } as const;

export type ZoteroSchema = typeof schema;
