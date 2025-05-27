import { itemAnnotations as annotations, groups, items } from "@zt/schema";
import { eq } from "drizzle-orm";
import { pick } from "@std/collections";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/zotero";

const parentItems = alias(items, "parentItems");
const parentItemColumns = {
  parentItemId: parentItems.itemId,
  parentItemKey: parentItems.key,
};

const annotationColumns = pick(annotations, [
  "itemId",
  "type",
  "authorName",
  "text",
  "comment",
  "color",
  "pageLabel",
  "sortIndex",
  "position",
  "isExternal",
]);
const itemColumns = pick(items, ["key", "libraryId"]);

export function buildAnnotationQuery() {
  return db
    .select({
      ...annotationColumns,
      ...itemColumns,
      ...parentItemColumns,
      groupId: groups.groupId,
    })
    .from(annotations)
    .innerJoin(items, eq(annotations.itemId, items.itemId))
    .leftJoin(groups, eq(items.libraryId, groups.libraryId))
    .leftJoin(parentItems, eq(annotations.parentItemId, parentItems.itemId));
}

export type AnnotationQueryRawResult = NonNullable<
  ReturnType<ReturnType<typeof buildAnnotationQuery>["get"]>
>;
