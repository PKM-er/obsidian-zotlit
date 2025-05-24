import { groups, libraries } from "@zt/schema";
import { db } from "@/db/zotero";
import { eq } from "drizzle-orm";
import { resolveName } from "./_common";

const statement = db
  .select({
    id: libraries.libraryId,
    type: libraries.type,
    groupId: groups.groupId,
    groupName: groups.name,
  })
  .from(libraries)
  .leftJoin(groups, eq(libraries.libraryId, groups.libraryId))
  .prepare();

export function getAllLibraries() {
  return statement.all().map(resolveName);
}
