import { groups, libraries } from "@zt/schema";
import { db } from "@/db/zotero";
import { eq, sql } from "drizzle-orm";

import * as v from "valibot";
import { LibrarySchema } from "./_common";

const ParamsSchema = v.object({
  libraryId: v.number(),
});

const statement = db
  .select({
    id: libraries.libraryId,
    type: libraries.type,
    groupId: groups.groupId,
    groupName: groups.name,
  })
  .from(libraries)
  .leftJoin(groups, eq(libraries.libraryId, groups.libraryId))
  .where(eq(libraries.libraryId, sql.placeholder("libraryId")))
  .prepare();

export function getLibraryById({ libraryId }: { libraryId: number }) {
  const result = statement.get(v.parse(ParamsSchema, { libraryId }));
  if (!result) return null;
  return v.parse(LibrarySchema, result);
}
