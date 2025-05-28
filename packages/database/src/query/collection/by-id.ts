import { db } from "@db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  collectionId: v.number(),
});

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.collectionId, sql.placeholder("collectionId")))
  .prepare();

export async function getCollectionById({
  collectionId,
}: { collectionId: number }) {
  const result = await statement.get(v.parse(ParamsSchema, { collectionId }));
  if (!result) return null;
  const parsed = await resolveCollectionPath([result]);
  return parsed.at(0) ?? null;
}
