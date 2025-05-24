import { db } from "@/db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";

type Params = {
  key: string;
};

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.key, sql.placeholder("key")))
  .prepare();

export function getCollectionByKey({ key }: { key: string }) {
  const result = statement.get({ key } satisfies Params);
  if (!result) return null;
  const parsed = resolveCollectionPath([result]);
  return parsed.at(0) ?? null;
}
