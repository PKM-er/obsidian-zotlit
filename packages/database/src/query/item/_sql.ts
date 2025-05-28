import { db } from "@db/zotero";
import type { SQL } from "drizzle-orm";

export function prepareItemQuery({
  where: whereClause,
}: { where: SQL | undefined }) {
  return db.query.items
    .findMany({
      columns: {
        libraryId: true,
        itemId: true,
        key: true,
        clientDateModified: true,
        dateAdded: true,
        dateModified: true,
        itemTypeId: true,
      },
      where: whereClause,
      with: {
        itemTags: {
          columns: { type: true },
          with: { tag: { columns: { name: true, tagId: true } } },
        },
        itemAttachments_parentItemId: {
          columns: {
            itemId: true,
            contentType: true,
            linkMode: true,
            path: true,
          },
          with: {
            charset: {
              columns: { charset: true },
            },
            item_itemId: {
              columns: { key: true },
            },
          },
        },
        collectionItems: {
          columns: { orderIndex: true },
          with: {
            collection: {
              columns: {
                collectionId: true,
                collectionName: true,
                key: true,
              },
            },
          },
        },
        itemData: {
          columns: {
            itemId: true,
          },
          with: {
            itemDataValue: { columns: { valueId: true, value: true } },
            fieldsCombined: {
              columns: {
                fieldId: true,
                fieldFormatId: true,
                custom: true,
                fieldName: true,
                label: true,
              },
            },
          },
        },
        itemCreators: {
          columns: {
            orderIndex: true,
            creatorId: true,
          },
          with: {
            creator: {
              columns: {
                firstName: true,
                lastName: true,
                fieldMode: true,
              },
            },
            creatorType: {
              columns: { creatorType: true },
            },
          },
        },
      },
    })
    .prepare();
}
export type ItemQueryRawResult = Awaited<
  ReturnType<ReturnType<typeof prepareItemQuery>["all"]>
>[number];
export type ItemQueryRawField = {
  itemId: number | null;
  fieldsCombined: {
    custom: number;
    fieldName: string;
    label: string | null;
    fieldFormatId: number | null;
    fieldId: number;
  } | null;
  itemDataValue: {
    value: string | null;
    valueId: number;
  } | null;
};
