import * as Schema from "@bbt/schema";
import * as Relations from "@bbt/relations";

export const schema = { ...Schema, ...Relations } as const;

export type BetterBibtexSchema = typeof schema;
