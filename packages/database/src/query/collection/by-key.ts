import { db } from "@db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  key: v.string(),
});

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.key, sql.placeholder("key")))
  .prepare();

export async function getCollectionByKey({ key }: { key: string }) {
  const result = await statement.get(v.parse(ParamsSchema, { key }));
  if (!result) return null;
  const parsed = await resolveCollectionPath([result]);
  return parsed.at(0) ?? null;
}
