import { groups, libraries } from "@zt/schema";
import { db } from "@/db";
import { eq, isNotNull } from "drizzle-orm";

export async function getLibraries() {
  const result = await db("zt")
    .select({
      id: libraries.libraryId,
      type: libraries.type,
      groupId: groups.groupId,
      groupName: groups.name,
    })
    .from(libraries)
    .leftJoin(groups, eq(libraries.libraryId, groups.libraryId))
    .where(isNotNull(libraries.libraryId))
    .orderBy(libraries.libraryId);
  return result.map((v) => ({
    ...v,
    name:
      v.type === "user"
        ? "My Library"
        : v.type === "group"
          ? v.groupName
          : null,
  }));
}
