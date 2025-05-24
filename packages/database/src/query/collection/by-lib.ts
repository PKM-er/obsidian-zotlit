import { db } from "@/db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";

type Params = {
  libraryId: number;
};

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.libraryId, sql.placeholder("libraryId")))
  .prepare();

export function getCollections({ libraryId }: { libraryId: number }) {
  const result = statement.all({
    libraryId,
  } satisfies Params);
  return resolveCollectionPath(result);
}
