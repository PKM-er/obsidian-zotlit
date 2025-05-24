import { groups, libraries } from "@zt/schema";
import { db } from "@/db/zotero";
import { eq, sql } from "drizzle-orm";
import { resolveName } from "./_common";

export type Params = {
  libraryId: number;
};

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

export function getLibraryById({ libraryId }: Params) {
  const result = statement.get({ libraryId } satisfies Params);
  if (!result) return null;
  return resolveName(result);
}
