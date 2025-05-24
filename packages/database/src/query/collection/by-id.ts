import { db } from "@/db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";

type Params = {
  collectionId: number;
};

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.collectionId, sql.placeholder("collectionId")))
  .prepare();

export function getCollectionById({ collectionId }: { collectionId: number }) {
  const result = statement.get({
    collectionId,
  } satisfies Params);
  if (!result) return null;
  const parsed = resolveCollectionPath([result]);
  return parsed.at(0) ?? null;
}
