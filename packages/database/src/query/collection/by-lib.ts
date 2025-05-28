import { db } from "@db/zotero";
import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import { collectionColumns, resolveCollectionPath } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  libraryId: v.number(),
});

const statement = db
  .select(collectionColumns)
  .from(collections)
  .where(eq(collections.libraryId, sql.placeholder("libraryId")))
  .prepare();

export async function getCollections({ libraryId }: { libraryId: number }) {
  const result = await statement.all(v.parse(ParamsSchema, { libraryId }));
  return await resolveCollectionPath(result);
}
